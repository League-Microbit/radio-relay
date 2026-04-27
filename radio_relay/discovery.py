"""Scan serial ports and identify RADIORELAY micro:bit devices.

Each candidate port is opened briefly, sent a `HELLO` line, and inspected
for a `DEVICE:RADIORELAY:...` announcement. Ports that don't respond, or
respond with a different device type, are skipped.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass

import serial
import serial.tools.list_ports


@dataclass
class RelayInfo:
    port: str
    device_type: str
    name: str
    hw_name: str
    serial: str

    @property
    def label(self) -> str:
        return f"{self.name} [{self.hw_name}] @ {self.port}"


def _normalize_port(dev: str) -> str:
    """On macOS, prefer /dev/tty.* over the cu.* alias that list_ports emits."""
    if sys.platform == "darwin" and dev.startswith("/dev/cu."):
        return "/dev/tty." + dev[len("/dev/cu."):]
    return dev


def _candidate_ports() -> list[str]:
    ports = []
    for p in serial.tools.list_ports.comports():
        dev = p.device
        if sys.platform == "darwin":
            # list_ports.comports() only enumerates /dev/cu.* paths on macOS,
            # so we filter on cu.* and then normalize to tty.* below.
            if dev.startswith("/dev/cu.usbmodem"):
                ports.append(_normalize_port(dev))
        elif sys.platform.startswith("linux"):
            if dev.startswith("/dev/ttyACM") or dev.startswith("/dev/ttyUSB"):
                ports.append(dev)
        else:
            if dev.upper().startswith("COM"):
                ports.append(dev)
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
    timeout: float = 1.5,
    only_radiorelay: bool = True,
) -> list[RelayInfo]:
    """Scan all candidate USB serial ports and return discovered devices."""
    found: list[RelayInfo] = []
    for port in _candidate_ports():
        info = probe(port, timeout=timeout)
        if info is None:
            continue
        if only_radiorelay and info.device_type != "RADIORELAY":
            continue
        found.append(info)
    return found
