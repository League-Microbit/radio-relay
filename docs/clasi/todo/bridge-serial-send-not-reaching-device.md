---
status: pending
---

# Bridge Serial Send Not Reaching Device

## Summary

Sending serial data to a micro:bit via the bridge API's "Send Serial"
endpoint does not appear to reach the device's `serial.onDataReceived`
handler. Radio communication and serial output (device → bridge) work
correctly.

## Environment

- Bridge console: `http://localhost:5173/s/8f1db137`
- Three micro:bit V2 boards connected via WebUSB
- All running a radio echo program that:
  - Announces via `DEVICE:ECHO:<name>:<id>` on startup
  - Listens for radio strings and prints them to serial (`[rx] ...`)
  - Listens for serial input and broadcasts it via radio (`[tx] ...`)
  - Button A sends a test ping via radio

## What Works

- Device announcements appear correctly in the device list API
- `serial.writeLine()` from the device shows up in the Serial Buffer API
- Radio send/receive works — pressing Button A on one device produces
  `[rx]` lines on the other two devices' serial output
- Flash Hex API successfully flashes all three devices

## What Doesn't Work

Sending serial data via the bridge API:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"data":"hello from claude"}' \
  http://localhost:5173/api/bridge/session/8f1db137/serial/DEVICE_ID
```

The API returns `{"ok":true}`, but:
- The device's `serial.onDataReceived` handler never fires
- No `[tx]` line appears in the device's serial output
- The message is never broadcast via radio
- Tried with and without explicit `\n` in the data field

## Expected Behavior

When sending `{"data":"test message\n"}` to the Send Serial endpoint:
1. The bridge sends the bytes to the device via WebUSB serial
2. MakeCode's `serial.onDataReceived(serial.delimiters(Delimiters.NewLine))`
   fires on the device
3. The device reads the string via `serial.readUntil()`
4. The device broadcasts it via radio and prints `[tx] test message`
5. The other two devices print `[rx] echo-XXXX: test message`

## Possible Causes

1. **WebUSB serial write not implemented** — The bridge may only read
   from the device's serial, not write to it.
2. **WebUSB write goes to wrong endpoint** — The device may have
   separate USB endpoints for serial in vs out, and the bridge may be
   writing to the wrong one.
3. **MakeCode serial input limitation** — MakeCode's `serial.onDataReceived`
   may only listen on UART pins, not on the USB serial interface. If so,
   this is a MakeCode limitation, not a bridge bug.
4. **Data framing** — The device may need specific framing (e.g., `\r\n`
   instead of `\n`, or raw bytes instead of JSON-decoded string).

## How to Test

The radio echo program on the devices is at:
`/Volumes/Proj/proj/league-projects/microbit/mb-template/src/main.ts`

The serial→radio handler in the program:
```typescript
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    if (line.length > 0) {
        radio.sendString(deviceName + ": " + line)
        serial.writeLine("[tx] " + line)
    }
})
```
