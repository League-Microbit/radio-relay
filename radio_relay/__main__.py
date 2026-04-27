"""rrctl — command-line front end for the RADIORELAY firmware.

Subcommands:
    rrctl ui [--port PORT] [--list] [--any] [--scan-timeout SECS]
        Launch the text UI. Without --port, scans all USB serial ports
        and prompts when more than one RADIORELAY is found.
"""

from __future__ import annotations

import argparse
import sys

from .discovery import RelayInfo, find_relays, probe
from .tui import run_tui


def _pick_port_interactive(relays: list[RelayInfo]) -> int | None:
    print("Multiple RADIORELAY devices found:")
    for i, info in enumerate(relays):
        print(f"  [{i}] {info.label}")
    while True:
        try:
            raw = input("Select index (or 'q' to quit): ").strip()
        except (EOFError, KeyboardInterrupt):
            return None
        if raw.lower() in ("q", "quit", "exit"):
            return None
        try:
            idx = int(raw)
        except ValueError:
            print("  Not a number.")
            continue
        if not 0 <= idx < len(relays):
            print(f"  Out of range (0-{len(relays) - 1}).")
            continue
        return idx


def _cmd_ui(args: argparse.Namespace) -> int:
    # Specific port: probe once, fall back to a stub record if it doesn't answer.
    if args.port:
        info = probe(args.port, timeout=args.scan_timeout)
        if info is None:
            print(
                f"No DEVICE announcement on {args.port}. "
                "Is the firmware loaded and running?",
                file=sys.stderr,
            )
            info = RelayInfo(
                port=args.port, device_type="?", name="?", hw_name="?", serial=""
            )
        if args.list:
            print(info.label)
            return 0
        run_tui([info], initial_index=0)
        return 0

    # Discovery mode.
    print("Scanning serial ports for RADIORELAY devices...", file=sys.stderr)
    relays = find_relays(timeout=args.scan_timeout, only_radiorelay=not args.any)
    if not relays:
        print("No RADIORELAY devices found.", file=sys.stderr)
        return 1

    if args.list:
        for info in relays:
            print(info.label)
        return 0

    if len(relays) == 1:
        run_tui(relays, initial_index=0)
        return 0

    idx = _pick_port_interactive(relays)
    if idx is None:
        return 0
    run_tui(relays, initial_index=idx)
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="rrctl",
        description="Control utility for the RADIORELAY micro:bit firmware.",
    )
    sub = parser.add_subparsers(dest="command", metavar="COMMAND")
    sub.required = True

    ui = sub.add_parser("ui", help="Launch the text user interface.")
    ui.add_argument(
        "-p", "--port",
        help="Serial port (e.g. /dev/ttyACM0). If omitted, all USB serial ports are scanned.",
    )
    ui.add_argument(
        "--scan-timeout", type=float, default=1.5,
        help="Seconds to wait for a HELLO reply per port (default: 1.5).",
    )
    ui.add_argument(
        "--list", action="store_true",
        help="List discovered RADIORELAY devices and exit (don't launch the UI).",
    )
    ui.add_argument(
        "--any", action="store_true",
        help="Don't filter discovery to RADIORELAY devices.",
    )
    ui.set_defaults(func=_cmd_ui)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
