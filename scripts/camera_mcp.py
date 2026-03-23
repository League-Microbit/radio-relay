"""
Camera MCP server for workbench observation.

Exposes four tools to an MCP client (e.g. VS Code Copilot):
  list_cameras   — probe which USB camera indices are available
  capture_frame  — grab a single still
  capture_burst  — grab N stills over a time window
  detect_motion  — compare two frames and return a motion score

Run with:
  uv run scripts/camera_mcp.py

Dependencies (managed via pyproject.toml):
  opencv-python-headless>=4.9
  mcp>=1.0
"""

import base64
import time
from typing import Any

import cv2
import numpy as np
import mcp.server.stdio
import mcp.types as types
from mcp.server import Server

server = Server("camera")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _open_camera(device_index: int) -> cv2.VideoCapture:
    cap = cv2.VideoCapture(device_index)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open camera at index {device_index}")
    return cap


def _grab_frame(
    cap: cv2.VideoCapture,
    width: int | None = None,
    height: int | None = None,
    quality: int = 75,
) -> str:
    """Read one frame from an open VideoCapture and return base64 JPEG."""
    ret, frame = cap.read()
    if not ret or frame is None:
        raise RuntimeError("Failed to read frame from camera")

    if width is not None:
        h, w = frame.shape[:2]
        new_h = int(h * width / w)
        frame = cv2.resize(frame, (width, new_h), interpolation=cv2.INTER_AREA)
    elif height is not None:
        h, w = frame.shape[:2]
        new_w = int(w * height / h)
        frame = cv2.resize(frame, (new_w, height), interpolation=cv2.INTER_AREA)

    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("JPEG encoding failed")
    return base64.b64encode(buf.tobytes()).decode("ascii")


def _image_content(b64: str) -> types.ImageContent:
    return types.ImageContent(type="image", data=b64, mimeType="image/jpeg")


# ---------------------------------------------------------------------------
# Tool: list_cameras
# ---------------------------------------------------------------------------

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="list_cameras",
            description=(
                "Probe USB camera device indices 0–9 and return the list of "
                "indices that are accessible. Call this first to find which "
                "device_index to pass to the other tools."
            ),
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        types.Tool(
            name="capture_frame",
            description=(
                "Capture a single still image from a USB webcam. "
                "Returns a JPEG image you can inspect directly. "
                "Default width is 640 px — request higher resolution only when fine detail is needed."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "device_index": {
                        "type": "integer",
                        "description": "Camera device index (default 0).",
                        "default": 0,
                    },
                    "width": {
                        "type": "integer",
                        "description": (
                            "Resize frame to this width in pixels before encoding; "
                            "height scales proportionally. Omit for native resolution."
                        ),
                    },
                    "height": {
                        "type": "integer",
                        "description": (
                            "Resize frame to this height; ignored if width is set."
                        ),
                    },
                    "quality": {
                        "type": "integer",
                        "description": "JPEG quality 1–100 (default 75).",
                        "default": 75,
                    },
                },
                "required": [],
            },
        ),
        types.Tool(
            name="capture_burst",
            description=(
                "Capture N frames spread over a time window. "
                "Useful for confirming whether something is moving at all."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "count": {
                        "type": "integer",
                        "description": "Number of frames to capture (default 3).",
                        "default": 3,
                    },
                    "interval_ms": {
                        "type": "integer",
                        "description": "Milliseconds between frames (default 500).",
                        "default": 500,
                    },
                    "device_index": {
                        "type": "integer",
                        "description": "Camera device index (default 0).",
                        "default": 0,
                    },
                    "width": {
                        "type": "integer",
                        "description": "Resize width in pixels; height scales proportionally.",
                    },
                    "quality": {
                        "type": "integer",
                        "description": "JPEG quality 1–100 (default 60).",
                        "default": 60,
                    },
                },
                "required": [],
            },
        ),
        types.Tool(
            name="detect_motion",
            description=(
                "Capture two frames separated by interval_ms and compute a "
                "motion score (mean absolute pixel difference, 0–255). "
                "Returns motion_detected=true when score exceeds threshold."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "interval_ms": {
                        "type": "integer",
                        "description": "Milliseconds between the two frames (default 1000).",
                        "default": 1000,
                    },
                    "threshold": {
                        "type": "number",
                        "description": "Score above this triggers motion_detected=true (default 10.0).",
                        "default": 10.0,
                    },
                    "device_index": {
                        "type": "integer",
                        "description": "Camera device index (default 0).",
                        "default": 0,
                    },
                    "width": {
                        "type": "integer",
                        "description": "Resize width in pixels before comparison.",
                    },
                    "return_image": {
                        "type": "boolean",
                        "description": (
                            "If true, include the before frame, after frame, and "
                            "an amplified diff image in the response (default false)."
                        ),
                        "default": False,
                    },
                },
                "required": [],
            },
        ),
    ]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------

@server.call_tool()
async def call_tool(
    name: str, arguments: dict[str, Any]
) -> list[types.TextContent | types.ImageContent]:

    if name == "list_cameras":
        available: list[int] = []
        for idx in range(10):
            cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                available.append(idx)
            cap.release()
        return [
            types.TextContent(
                type="text",
                text=f"Available camera indices: {available}" if available else "No cameras found.",
            )
        ]

    if name == "capture_frame":
        device_index = int(arguments.get("device_index", 0))
        width = arguments.get("width")
        height = arguments.get("height")
        quality = int(arguments.get("quality", 75))
        if width is not None:
            width = int(width)
        if height is not None:
            height = int(height)

        cap = _open_camera(device_index)
        try:
            # Discard the first frame — many cameras return a stale/dark frame
            cap.read()
            b64 = _grab_frame(cap, width=width, height=height, quality=quality)
        finally:
            cap.release()
        return [_image_content(b64)]

    if name == "capture_burst":
        count = int(arguments.get("count", 3))
        interval_ms = int(arguments.get("interval_ms", 500))
        device_index = int(arguments.get("device_index", 0))
        width = arguments.get("width")
        quality = int(arguments.get("quality", 60))
        if width is not None:
            width = int(width)

        cap = _open_camera(device_index)
        try:
            cap.read()  # discard first stale frame
            frames: list[types.ImageContent] = []
            for i in range(count):
                if i > 0:
                    time.sleep(interval_ms / 1000.0)
                b64 = _grab_frame(cap, width=width, quality=quality)
                frames.append(_image_content(b64))
        finally:
            cap.release()
        return frames  # type: ignore[return-value]

    if name == "detect_motion":
        interval_ms = int(arguments.get("interval_ms", 1000))
        threshold = float(arguments.get("threshold", 10.0))
        device_index = int(arguments.get("device_index", 0))
        width = arguments.get("width")
        return_image = bool(arguments.get("return_image", False))
        if width is not None:
            width = int(width)

        cap = _open_camera(device_index)
        try:
            cap.read()  # discard stale frame
            b64_before = _grab_frame(cap, width=width, quality=80)
            time.sleep(interval_ms / 1000.0)
            b64_after = _grab_frame(cap, width=width, quality=80)
        finally:
            cap.release()

        # Decode for comparison
        before_bytes = base64.b64decode(b64_before)
        after_bytes = base64.b64decode(b64_after)
        before_arr = cv2.imdecode(
            np.frombuffer(before_bytes, dtype="uint8"),
            cv2.IMREAD_GRAYSCALE,
        )
        after_arr = cv2.imdecode(
            np.frombuffer(after_bytes, dtype="uint8"),
            cv2.IMREAD_GRAYSCALE,
        )

        diff = cv2.absdiff(before_arr, after_arr)
        score = float(diff.mean())
        motion_detected = score > threshold

        result: list[types.TextContent | types.ImageContent] = [
            types.TextContent(
                type="text",
                text=(
                    f"motion_detected: {motion_detected}\n"
                    f"score: {score:.2f}\n"
                    f"threshold: {threshold}"
                ),
            )
        ]

        if return_image:
            # Amplify diff for visibility
            diff_amplified = cv2.convertScaleAbs(diff, alpha=4.0)
            ok, buf = cv2.imencode(".jpg", diff_amplified, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ok:
                diff_b64 = base64.b64encode(buf.tobytes()).decode("ascii")
                result.append(_image_content(b64_before))
                result.append(_image_content(b64_after))
                result.append(_image_content(diff_b64))

        return result

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def _main() -> None:
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    import asyncio

    asyncio.run(_main())
