"""Serial wrapper for the RADIORELAY firmware.

Wraps a `pyserial` connection. A background reader thread feeds incoming
lines to a callback so the caller (e.g. the TUI) can react without
blocking. Sends are synchronous and small enough that we don't bother
with a dedicated writer thread.
"""

from __future__ import annotations

import threading
from typing import Callable

import serial

from .discovery import _normalize_port


class RadioRelay:
    BAUD = 115200
    MAX_PAYLOAD = 18  # firmware truncates anything longer

    def __init__(self, port: str):
        self.port = _normalize_port(port)
        self._ser: serial.Serial | None = None
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def open(self) -> None:
        self._ser = serial.Serial(self.port, self.BAUD, timeout=0.2)

    def close(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=1.0)
            self._thread = None
        if self._ser is not None:
            try:
                self._ser.close()
            except Exception:
                pass
            self._ser = None

    def __enter__(self) -> "RadioRelay":
        self.open()
        return self

    def __exit__(self, *_exc) -> None:
        self.close()

    def _write_line(self, line: str) -> None:
        if self._ser is None:
            raise RuntimeError("port not open")
        if not line.endswith("\n"):
            line = line + "\n"
        self._ser.write(line.encode())
        self._ser.flush()

    # --- Protocol commands (mirror src/main.ts) ---

    def send_message(self, msg: str) -> str:
        """Send a radio message. Returns the (possibly truncated) payload."""
        if len(msg) > self.MAX_PAYLOAD:
            msg = msg[: self.MAX_PAYLOAD]
        self._write_line(">" + msg)
        return msg

    def set_channel(self, channel: int) -> None:
        if not 0 <= channel <= 35:
            raise ValueError("channel must be 0-35 for !C")
        self._write_line(f"!C {channel}")

    def set_channel_group(self, channel: int, group: int) -> None:
        if not 0 <= channel <= 83:
            raise ValueError("channel must be 0-83")
        if not 0 <= group <= 255:
            raise ValueError("group must be 0-255")
        self._write_line(f"!CG {channel} {group}")

    def request_help(self) -> None:
        self._write_line("!HELP")

    def request_status(self) -> None:
        self._write_line("?")

    def hello(self) -> None:
        self._write_line("HELLO")

    # --- Background reader ---

    def start_reader(self, on_line: Callable[[str], None]) -> None:
        """Spawn a daemon thread that calls `on_line(text)` per LF-terminated line."""
        if self._ser is None:
            raise RuntimeError("port not open")
        if self._thread is not None:
            return

        def loop() -> None:
            buf = b""
            while not self._stop.is_set():
                try:
                    chunk = self._ser.read(256) if self._ser else b""
                except (serial.SerialException, OSError):
                    return
                if not chunk:
                    continue
                buf += chunk
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    text = line.decode(errors="replace").rstrip("\r")
                    try:
                        on_line(text)
                    except Exception:
                        pass

        self._thread = threading.Thread(target=loop, daemon=True, name=f"relay-rx:{self.port}")
        self._thread.start()
