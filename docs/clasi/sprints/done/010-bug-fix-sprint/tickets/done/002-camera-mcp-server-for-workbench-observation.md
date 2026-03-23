---
id: "002"
title: "Camera MCP server for workbench observation"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: "docs/clasi/todo/camera-mcp-server.md"
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Camera MCP server for workbench observation

## Description

Build `scripts/camera_mcp.py` — a Python MCP server that gives the AI assistant
access to a USB webcam mounted over the workbench. The AI can capture frames,
detect motion between frames, and verify that physical robots are behaving as
expected after code deploys.

Dependencies (`opencv-python-headless`, `mcp`) are added to `pyproject.toml`.
The server is registered in `.mcp.json` and run via `uv run`.

## Acceptance Criteria

- [x] `scripts/camera_mcp.py` exists and is a valid MCP server
- [x] `list_cameras` tool probes indices 0–9 and returns available camera indices
- [x] `capture_frame` tool returns a base64 JPEG image content block; accepts `device_index`, `width`, `quality` params
- [x] `capture_burst` tool returns N frames over a time window; accepts `count`, `interval_ms`, `device_index`, `width`, `quality`
- [x] `detect_motion` tool compares two frames and returns `motion_detected` bool + numeric `score`; accepts `interval_ms`, `threshold`, `device_index`, `width`, `return_image`
- [x] `pyproject.toml` includes `opencv-python-headless>=4.9` and `mcp>=1.0`
- [x] `.mcp.json` registers the server as `camera` using `uv run scripts/camera_mcp.py`
- [x] Camera is released after every tool call (no persistent handle)

## Testing

- **Existing tests to run**: n/a (no existing Python tests)
- **New tests to write**: manual — run `uv run scripts/camera_mcp.py` and verify it starts without error; call `list_cameras` via MCP inspector or VS Code
- **Verification command**: `uv run scripts/camera_mcp.py` (should start and await MCP stdio)
