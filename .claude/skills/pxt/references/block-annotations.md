# Block Annotations Reference

Complete reference for MakeCode/PXT `//% ...` annotations used to
define blocks. Based on the [Defining Blocks](https://makecode.com/defining-blocks)
documentation.

## How Annotations Work

Place `//%` comments on the line immediately before a function (or
enum, or parameter). Multiple annotations can go on one line
(space-separated) or on separate `//% ...` lines.

```typescript
//% block="show %text" blockId=robot_show weight=80
export function show(text: string): void { }

// Equivalent multi-line form:
//% block="show %text"
//% blockId=robot_show
//% weight=80
export function show(text: string): void { }
```

---

## Block Definition

### `block`

The block label string. Use `%paramName` to insert parameter slots.

```typescript
//% block="move %direction at %speed"
export function move(direction: Direction, speed: number): void { }
```

Parameter placeholders match the function parameter names. The label
between placeholders becomes static text on the block.

### `blockId`

A globally unique, stable identifier for the block. Once published,
do not change it — saved projects reference blocks by this ID.

```typescript
//% blockId=robot_move
```

Convention: `namespace_functionName` (lowercase, underscores).

### `blockNamespace`

Override which toolbox category the block appears in. Useful when a
function is defined in one namespace but should appear in another
category.

```typescript
//% blockNamespace=robot
```

---

## Layout and Ordering

### `weight`

Sort order within the toolbox category. Higher values appear first.
Default is 50.

```typescript
//% weight=100   // appears at top
//% weight=10    // appears near bottom
```

### `group`

Groups blocks under a collapsible heading in the toolbox.

```typescript
//% group="Movement"
//% group="Sensors"
```

### `subcategory`

Places the block under a subcategory tab in the toolbox.

```typescript
//% subcategory="Advanced"
```

### `advanced`

Puts the block in the "Advanced" section of the toolbox (collapsed
by default).

```typescript
//% advanced=true
```

---

## Appearance

### `color`

Block color as a hue value (0–360). Overrides the namespace color.

```typescript
//% color=120   // green
//% color=230   // blue
```

### `icon`

FontAwesome icon displayed on the block. Use the unicode escape.

```typescript
//% icon="\uf1b9"   // car icon
//% icon="\uf0e7"   // bolt icon
```

### `imageLiteral`

Number of LED matrices to show as a pixel editor. Used for functions
that accept an image string.

```typescript
//% imageLiteral=1
export function showImage(leds: string): void { }
```

---

## Parameters

### `block` parameter placeholders

Parameters appear in the block label as `%paramName`. The type of the
parameter determines what widget appears:

| Type | Widget |
|---|---|
| `number` | Number input field |
| `string` | Text input field |
| `boolean` | Boolean toggle |
| `enum` | Dropdown menu |
| Custom enum | Dropdown with enum values |

### Enum parameters

Define an enum, then use it as a parameter type. PXT automatically
creates a dropdown.

```typescript
enum Direction {
    //% block="forward"
    Forward = 0,
    //% block="backward"
    Backward = 1,
    //% block="left"
    Left = 2,
    //% block="right"
    Right = 3
}

//% block="turn %direction"
export function turn(direction: Direction): void { }
```

The `//% block="..."` on each enum member sets its display label in
the dropdown.

### `min` and `max`

Constrain numeric parameter values in the editor.

```typescript
//% block="set speed %speed"
//% speed.min=0 speed.max=100
export function setSpeed(speed: number): void { }
```

### `defl`

Default value for a parameter.

```typescript
//% block="pause %ms ms"
//% ms.defl=500
export function pause(ms: number): void { }
```

### `shadow`

Attach a shadow block (pre-filled value block) to a parameter.

```typescript
//% block="set color %color"
//% color.shadow="colorNumberPicker"
export function setColor(color: number): void { }
```

Common shadow types: `colorNumberPicker`, `timePicker`,
`notePicker`, `speedPicker`.

### `expandableArgumentMode`

Enable expandable parameters (optional params that appear when the
block is expanded).

```typescript
//% block="move %direction || at %speed"
//% expandableArgumentMode="toggle"
//% speed.defl=50
export function move(direction: Direction, speed?: number): void { }
```

The `||` in the block string separates required from optional
parameters. Modes: `"toggle"`, `"enabled"`.

---

## Block Shape and Output

### `blockSetVariable`

When this block is dragged out, auto-wrap in a "set variable" block.

```typescript
//% blockSetVariable=mySprite
export function createSprite(): Sprite { }
```

### `blockAllowMultiple`

Allow the block to be duplicated (default is true).

```typescript
//% blockAllowMultiple=false
```

---

## Namespace-Level Annotations

Annotate the namespace declaration to configure the entire toolbox
category.

```typescript
//% color=120 weight=100 icon="\uf1b9"
//% groups=["Movement", "Sensors", "Config"]
namespace robot {
    // ...
}
```

| Annotation | Purpose |
|---|---|
| `color=N` | Category color (hue 0–360) |
| `weight=N` | Category sort order |
| `icon="..."` | Category icon |
| `groups=[...]` | Define and order groups within the category |

---

## Handler / Event Blocks

### `blockHandlerStatement`

Mark a function that takes a callback as an event handler block
(C-shaped block).

```typescript
//% block="on button %button pressed"
//% blockHandlerStatement=1
export function onButtonPressed(button: Button, handler: () => void): void { }
```

---

## Mutability

### `blockCombine`

Combine getter/setter into one block with a toggle.

```typescript
//% blockCombine
export function speed(): number { return 0; }

//% blockCombine
export function setSpeed(v: number): void { }
```

---

## Tooltip and Help

### `help`

URL path for the block's help page (relative to docs root).

```typescript
//% help=robot/move
```

### `blockGap`

Pixel gap between this block and the next in the toolbox.

```typescript
//% blockGap=16
```

---

## Quick Reference

Minimal block definition:

```typescript
namespace robot {
    //% block="do something"
    //% blockId=robot_doSomething
    export function doSomething(): void { }
}
```

Full-featured block definition:

```typescript
//% color=180 weight=100 icon="\uf1b9"
//% groups=["Movement", "Sensors"]
namespace robot {
    //% block="drive %direction at speed %speed"
    //% blockId=robot_drive
    //% weight=90 group="Movement"
    //% speed.min=0 speed.max=100 speed.defl=50
    //% help=robot/drive
    export function drive(direction: Direction, speed: number): void {
        // implementation
    }
}
```
