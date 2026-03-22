---
name: PXT Framework
description: MakeCode/PXT conventions for namespaces, block annotations, C++ shims, extension structure, and build configuration
---

# PXT Framework

This skill covers how to structure code for MakeCode (PXT) extensions
targeting micro:bit. Consult this before creating files, defining blocks,
writing C++ shims, or modifying `pxt.json`.

## Namespace Convention

- All student-facing code lives inside a `namespace`. The default
  namespace for this project is `robot`.
- Library `.ts` files must not have top-level executable code. All
  functions, variables, and enums go inside a namespace.
- Test files (`test/`) may have top-level code because they run as
  the entry point during `pxt test`.

```typescript
// CORRECT — library code in a namespace
namespace robot {
    //% block="move forward"
    export function moveForward(): void {
        // ...
    }
}

// WRONG — top-level code in a library file
function moveForward(): void { /* ... */ }
```

## Block Annotations

PXT uses `//% ...` comments to expose TypeScript functions as visual
blocks in the MakeCode editor. Place the annotation on the line
immediately before the function declaration, inside the namespace.

### Essential Annotations

| Annotation | Purpose | Example |
|---|---|---|
| `block="..."` | Block label shown in editor | `//% block="move %direction"` |
| `blockId=...` | Stable unique ID for the block | `//% blockId=robot_move` |
| `weight=N` | Sort order (higher = appears first) | `//% weight=100` |
| `group="..."` | Group name in toolbox | `//% group="Movement"` |
| `color=N` | Block color (hue 0–360) | `//% color=120` |
| `icon="\uf..."` | FontAwesome icon unicode | `//% icon="\uf1b9"` |

### Example

```typescript
namespace robot {
    //% block="drive %direction at speed %speed"
    //% blockId=robot_drive
    //% weight=90 group="Movement"
    export function drive(direction: Direction, speed: number): void {
        // ...
    }
}
```

For the full annotation reference, see
[references/block-annotations.md](references/block-annotations.md).

## C++ Shim Pattern

When you need direct hardware access that STS cannot provide, use the
C++ shim pattern:

1. **C++ file** (e.g., `src/ir.cpp`): Define the native function with
   a `//%` annotation.

   ```cpp
   namespace robot {
       //%
       void sendPulse(int pin, int durationUs) {
           uBit.io.pin[pin].setDigitalValue(1);
           wait_us(durationUs);
           uBit.io.pin[pin].setDigitalValue(0);
       }
   }
   ```

2. **TypeScript shim file** (e.g., `src/shims.ts`): Declare the
   function with `//% shim=namespace::function`.

   ```typescript
   namespace robot {
       //% shim=robot::sendPulse
       export function sendPulse(pin: number, durationUs: number): void {
           // Simulator fallback — runs when not on hardware
           basic.pause(durationUs / 1000)
       }
   }
   ```

3. The function body in the `.ts` file is the **simulator fallback**.
   It runs in the browser simulator. The C++ runs on real hardware.

## files vs testFiles in pxt.json

`pxt.json` has two arrays that control compilation:

| Array | When compiled | What goes here |
|---|---|---|
| `files` | Always (library builds, test builds, deploy) | All `.ts` in `src/`, all `.cpp`, `README.md`, `enums.d.ts`, `shims.d.ts` |
| `testFiles` | Only when building/testing this repo directly (`pxt build`, `pxt test`) | All `.ts` in `test/`, plus `src/main.ts` if it exists |

**If you create a `.ts` or `.cpp` file and do not add it to the
appropriate array, PXT silently ignores it.** The code will not compile
and you will get no error about the missing file.

## Extension Authoring

This repo is structured as a PXT extension that students can import
into their own MakeCode projects.

- **Classroom use**: `"public": false` in `pxt.json` is fine. Students
  import by GitHub URL: `https://github.com/org/repo`.
- **File structure**: Keep source in `src/`, tests in `test/`. The
  `pxt.json` at the repo root is the extension manifest.
- **For classmates to import**: They add the GitHub URL in MakeCode
  under "Extensions" → paste URL. The extension appears as a toolbox
  category matching the namespace name.
- **Dependencies**: Only PXT extensions can be dependencies. Do not
  reference npm packages in `pxt.json`. Dependencies go in the
  `"dependencies"` object with `"extensionName": "github:org/repo"`.

## Device Serial Numbers

The DAPLink USB serial number is a 48-character hex string, e.g.
`990636020005282052f41cc66121efc6000000006e052820`. The structure:

| Chars | Name | Length | Example | Use |
|---|---|---|---|---|
| 0–15 | Prefix | 16 | `9906360200052820` | Same for all micro:bits |
| 16–31 | **Short** | 16 | `52f41cc66121efc6` | Unique MCU ID — bridge console tab label |
| 26–31 | **Display** | 6 | `21efc6` | Shown next to device name in controls bar |
| 32–47 | Suffix | 16 | `000000006e052820` | Same for all micro:bits |

- **Short serial** = `fullSerial.substring(16, 32)` — uniquely identifies each board,
  used as the tab label before a device announcement replaces it.
- **Display serial** = `fullSerial.substring(26, 32)` — the 6-char hex shown in the
  console UI next to the device name.

When referencing devices in `pxt.json` `bridge.devices`, the value can
be the device announcement name (e.g., `guvov`) or the last 6 hex
digits of the full serial (e.g., `c7141e`), which matches against
device IDs in the bridge API.

## Debugging: USB Volume Files

When a micro:bit is connected via USB it appears as a mounted volume
(e.g., `/Volumes/MICROBIT`). Two files on the volume are useful for
debugging:

### DETAILS.TXT

Contains DAPLink firmware info and device identity. Key fields:

| Field | Use |
|---|---|
| `Unique ID` | Full device serial number (matches HID/DAP enumeration) |
| `Interface Version` | DAPLink firmware version |
| `Bootloader Version` | Bootloader firmware version |
| `Daplink Mode` | `Interface` (normal) or `Bootloader` (recovery) |
| `URL` | Device info page with hardware ID |

### FAIL.TXT

Created when a hex flash fails. Contains the error message and type.
Common failures:

| Error | Meaning |
|---|---|
| "hex file cannot be decoded" | Checksum failure — hex was corrupted during copy |
| "hex file is out of order" | Records in unexpected order — bad file transfer |
| "transfer has timed out" | Flash took too long |

**Always check `FAIL.TXT` after flashing.** A successful flash deletes
this file; its presence means the last flash failed and the device is
still running the previous program.

**Do not use `dd` or `cp` to copy hex files on macOS** — they can
corrupt the transfer. Use `fs.writeFileSync()` (Node.js) or the
`scripts/flash-local.js` script.

### Error Codes Reference

When a micro:bit shows a number on its LED display after a sad face,
that's an error code. See
[references/error-codes.json](references/error-codes.json) for the
full list. Key ranges:

- **010–099**: Hardware errors (I2C, memory, accelerometer)
- **500–599**: DAPLink USB flash errors (not runtime — the hex transfer failed)
- **840–849**: Garbage collector errors
- **901–928**: MakeCode runtime errors (invalid objects, incompatible version)
- **980–989**: JavaScript cast errors (wrong type used)
