#!/usr/bin/env python3

import sys
import serial

DEFAULT_PORT = "/dev/tty.usbmodem21431402"
BAUD = 115200

args = sys.argv[1:]

if not args:
    print("Usage: serial-send.py [port] <message>", file=sys.stderr)
    print("  e.g. serial-send.py /dev/tty.usbmodem21431402 hello world", file=sys.stderr)
    print("  or   serial-send.py hello world  (uses default port)", file=sys.stderr)
    sys.exit(1)

if args[0].startswith("/dev/"):
    port = args[0]
    message_parts = args[1:]
else:
    port = DEFAULT_PORT
    message_parts = args

message = " ".join(message_parts)

if not message:
    print("No message provided.", file=sys.stderr)
    sys.exit(1)

ser = serial.Serial()
ser.port = port
ser.baudrate = BAUD
ser.timeout = 5
ser.open()

# Wait for device announcement after reset
print("Waiting for device...", file=sys.stderr)
while True:
    line = ser.readline().decode(errors="replace").strip()
    if line:
        print(f"< {line}", file=sys.stderr)
    if line.startswith("DEVICE:"):
        break

ser.write((message + "\n").encode())
ser.flush()
print(f'Sent "{message}" to {port}')

# Read back any response
ser.timeout = 1
while True:
    line = ser.readline().decode(errors="replace").strip()
    if not line:
        break
    print(f"< {line}")

ser.close()