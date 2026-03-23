---
status: done
---

# Camera MCP Server for Workbench Observation

## Description

Build a Python MCP server script (`scripts/camera_mcp.py`) that gives the
AI assistant access to a USB webcam mounted over the workbench. This enables
visual verification that physical robots are behaving as expected after code
deploys.

## Requirements

- **Platform:** macOS, USB webcam (cv2.VideoCapture)
- **Location:** `scripts/camera_mcp.py` — single standalone script for now
- **Dependencies:** added to `pyproject.toml` — `opencv-python-headless`, `mcp`
- **Runtime:** `uv run scripts/camera_mcp.py` (uv manages the venv from pyproject.toml)

## Tools to expose

### `capture_frame`
Grabs a single still from the webcam.

Parameters:
- `device_index` (int, default 0) — which camera to use
- `width` (int, optional) — resize to this width before returning; height
  scales proportionally (keeps context size small)
- `height` (int, optional) — resize to this height; ignored if `width` set
- `quality` (int, default 75) — JPEG quality 1–100

Returns: base64-encoded JPEG as an MCP image content block so the AI can
render and inspect it inline.

### `capture_burst`
Grabs N frames over a time window — useful for detecting whether something
moved between frames.

Parameters:
- `count` (int, default 3) — number of frames
- `interval_ms` (int, default 500) — milliseconds between frames
- `device_index` (int, default 0)
- `width` (int, optional)
- `quality` (int, default 60)

Returns: list of base64-encoded JPEG images.

### `detect_motion`
Captures two frames separated by `interval_ms` and returns a motion score
(mean absolute diff of grayscale frames, 0–255) plus a boolean `motion_detected`
flag based on a configurable threshold. Optionally returns an annotated diff
image.

Parameters:
- `interval_ms` (int, default 1000)
- `threshold` (float, default 10.0) — motion score above this → `motion_detected: true`
- `device_index` (int, default 0)
- `width` (int, optional)
- `return_image` (bool, default false) — if true, include diff frame as image

Returns: `{ motion_detected, score, frame_before, frame_after }` (images only
if `return_image` is true).

### `list_cameras`
Probes device indices 0–9 and returns the indices of cameras that opened
successfully.

## MCP registration

After the script is written, add it to `.mcp.json` under a `camera` key:

```json
"camera": {
  "type": "stdio",
  "command": "uv",
  "args": ["run", "scripts/camera_mcp.py"]
}
```

## Notes

- Use `opencv-python-headless` to avoid pulling in GUI deps.
- Always release the VideoCapture object after each tool call (don't hold
  it open between calls — avoids OS-level camera locking).
- Dependencies go in `pyproject.toml`; `uv run` handles the venv automatically
  so no manual `pip install` step is needed.
- The AI should default to a low resolution (e.g., width=640) to keep
  image tokens reasonable, and explicitly request higher resolution only
  when fine detail is needed.
