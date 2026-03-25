# micro:bit Radio Relay

A serial-to-radio bridge for BBC micro:bit V2. Connects a host computer
to the micro:bit radio network — everything received on the serial port
is sent over radio, and everything received over radio is sent to the
serial port.

## How It Works

A micro:bit running the radio relay sits between your computer (or the
bridge console) and other micro:bits on the same radio channel. The
relay forwards messages in both directions:

```
Host (serial) ──> relay ──> radio ──> other micro:bits
Host (serial) <── relay <── radio <── other micro:bits
```

The LED display shows the current channel as a base-36 character
(`0`–`9`, `A`–`Z`) for channels 0–35, or `?` if the channel/group is
outside that range.

## Serial Protocol

Every line sent to or from the relay starts with a prefix character that
indicates what it is:

| Prefix | Direction | Meaning |
|--------|-----------|---------|
| `>`    | host → relay | Send the rest of the line over radio (max 18 chars) |
| `<`    | relay → host | A message received from radio |
| `!`    | host → relay | Command (see below) |
| `?`    | host → relay | Query current channel and group |
| `#`    | relay → host | Comment or status from the relay |

### Commands

| Command | Description |
|---------|-------------|
| `!C <ch>` | Set channel (0–35) with default group 10. Display shows the channel character. |
| `!CG <ch> <group>` | Set channel (0–83) and group (0–255). Display shows `?`. |
| `!RC <ch> <group>` | Same as `!CG`. |
| `!HELP` | Print protocol summary to serial. |
| `?` | Report current channel and group. |

### Examples

```
>hello                    # send "hello" over radio
<world                    # received "world" from radio
!C 10                     # set to channel 10 (display shows "A"), group 10
!CG 5 42                  # set to channel 5, group 42 (display shows "?")
?                         # query → responds: # channel: 5 group: 42
!HELP                     # print help
```

## Channels

Channels are displayed on the LED as base-36 characters:

| Channel | Display | Channel | Display |
|---------|---------|---------|---------|
| 0–9     | `0`–`9` | 10–35   | `A`–`Z` |

The micro:bit radio supports frequency bands 0–83, but only channels
0–35 have a display character. Channels set via `!CG` or `!RC` outside
this range (or with a non-default group) show `?`.

The default group is **10**. When the group is 10, the A and B buttons
on the micro:bit cycle through channels 0–35:

- **Button A** — previous channel (wraps from 0 to 35)
- **Button B** — next channel (wraps from 35 to 0)

Pressing a button announces the change over serial.

## Radio Payload

The micro:bit radio string payload is **18 characters** maximum. Messages
longer than 18 characters are truncated with a warning sent to the host.

## Device Announcement

On boot, the relay emits a device announcement line:

```
DEVICE:RADIOBRIDGE:relay:<deviceName>:<serialNumber>
```

The host can send `HELLO` at any time to request the announcement again.

## Build & Deploy

| Command | What it does |
|---------|--------------|
| `npm run setup` | Install dependencies |
| `npm run build` | Compile to `.hex` |
| `npm run deploy` | Build and flash to connected micro:bit |

## Project Structure

| File | Purpose |
|------|---------|
| `src/main.ts` | Radio relay logic — serial handler, radio handler, button handlers |
| `src/announce.ts` | Device announcement protocol |
| `pxt.json` | Project manifest and build config |

## License

MIT
