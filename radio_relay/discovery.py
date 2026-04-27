"""Scan serial ports and identify RADIORELAY micro:bit devices.

Each candidate port is opened briefly, sent a `HELLO` line, and inspected
for a `DEVICE:RADIORELAY:...` announcement. Ports filter by USB VID/PID
(`0d28:0204`, BBC micro:bit DAPLink), so unrelated USB-CDC devices like
Flipper Zeros are skipped.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass

import serial
import serial.tools.list_ports


# BBC micro:bit DAPLink (ARM mbed)
_MICROBIT_VID = 0x0D28
_MICROBIT_PID = 0x0204


@dataclass
class RelayInfo:
    port: str
    device_type: str
    name: str
    hw_name: str
    serial: str
    responsive: bool = True

    @property
    def label(self) -> str:
        if self.responsive:
            return f"{self.name} [{self.hw_name}] @ {self.port}"
        return f"? (no reply) @ {self.port}"


def _normalize_port(dev: str) -> str:
    """On macOS, prefer /dev/tty.* over the cu.* alias that list_ports emits."""
    if sys.platform == "darwin" and dev.startswith("/dev/cu."):
        return "/dev/tty." + dev[len("/dev/cu."):]
    return dev


def _candidate_ports() -> list[str]:
    """Enumerate USB serial ports that look like a micro:bit DAPLink."""
    ports = []
    for p in serial.tools.list_ports.comports():
        if p.vid == _MICROBIT_VID and p.pid == _MICROBIT_PID:
            ports.append(_normalize_port(p.device))
    return ports


def _parse_announcement(line: str) -> RelayInfo | None:
    if not line.startswith("DEVICE:"):
        return None
    parts = line.split(":")
    if len(parts) < 5:
        return None
    return RelayInfo(
        port="",
        device_type=parts[1],
        name=parts[2],
        hw_name=parts[3],
        serial=parts[4] if len(parts) > 4 else "",
    )


def probe(port: str, timeout: float = 1.5) -> RelayInfo | None:
    """Open `port`, send HELLO, return RelayInfo if a DEVICE line appears."""
    port = _normalize_port(port)
    try:
        ser = serial.Serial(port, 115200, timeout=0.2)
    except (serial.SerialException, OSError):
        return None
    try:
        time.sleep(0.1)
        ser.reset_input_buffer()
        ser.write(b"HELLO\n")
        ser.flush()
        deadline = time.time() + timeout
        buf = b""
        while time.time() < deadline:
            chunk = ser.read(256)
            if chunk:
                buf += chunk
                if b"\n" in buf:
                    for raw in buf.split(b"\n"):
                        text = raw.decode(errors="replace").strip()
                        info = _parse_announcement(text)
                        if info is not None:
                            info.port = port
                            return info
    finally:
        ser.close()
    return None


def find_relays(
    timeout: float = 2.5,
    only_radiorelay: bool = True,
    include_silent: bool = False,
) -> list[RelayInfo]:
    """Scan all candidate USB serial ports.

    Args:
        timeout: Seconds to wait per port for a HELLO reply.
        only_radiorelay: If True, drop boards that announced a different type.
        include_silent: If True, also return ports that didn't respond at all
            as placeholder entries (responsive=False). Useful for the TUI so
            the user can still see and switch to those ports.
    """
    found: list[RelayInfo] = []
    for port in _candidate_ports():
        info = probe(port, timeout=timeout)
        if info is None:
            if include_silent:
                found.append(
                    RelayInfo(
                        port=port,
                        device_type="?",
                        name="?",
                        hw_name="?",
                        serial="",
                        responsive=False,
                    )
                )
            continue
        if only_radiorelay and info.device_type != "RADIORELAY":
            if include_silent:
                # Keep it visible but mark as non-relay.
                found.append(info)
            continue
        found.append(info)
    return found
