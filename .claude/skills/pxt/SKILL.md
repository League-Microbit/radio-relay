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
