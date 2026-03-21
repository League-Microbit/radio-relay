---
name: Static TypeScript
description: Language subset rules and constraints for MakeCode/PXT Static TypeScript targeting micro:bit V2
---

# Static TypeScript (STS)

MakeCode compiles a **subset** of TypeScript called Static TypeScript.
Code that is valid TypeScript may still fail the STS compiler. Always
check this reference before writing or suggesting TypeScript in this
project.

## Disallowed Features

The following features are **not supported** by STS. Do not use them.

| Feature | Why it fails |
|---|---|
| `any` type | STS requires all types to be statically known |
| `async` / `await` | No async runtime; use `control.inBackground()` |
| `Promise` | Not available in the STS runtime |
| `Map` / `Set` / `WeakMap` / `WeakSet` | Not available; use arrays or plain objects |
| Regular expressions (`RegExp`, `/pattern/`) | Not supported by the compiler |
| `JSON.parse()` / `JSON.stringify()` | Not available in STS |
| `for...of` on non-array iterables | Only arrays support `for...of`; no generic iterables |
| Optional chaining `?.` | Not supported by the STS parser |
| Nullish coalescing `??` | Not supported by the STS parser |
| ES module `import` / `export` | Use `namespace` blocks; STS has no module system |
| Template literal types | Not supported |
| `typeof` in type position (e.g., `type T = typeof x`) | Not supported |
| `keyof` | Not supported |
| Mapped types (e.g., `{ [K in keyof T]: ... }`) | Not supported |
| Conditional types (e.g., `T extends U ? X : Y`) | Not supported |
| Utility types (`Partial`, `Required`, `Pick`, `Omit`, `Record`, etc.) | Not supported |

## What to Use Instead

| Instead of... | Use... |
|---|---|
| `import` / `export` | `namespace MyLib { ... }` — all code goes in namespaces |
| `async` / `await` | `control.inBackground(() => { ... })` |
| `any` | Declare a concrete type or interface |
| `Map<K, V>` | Parallel arrays or a plain object with known keys |
| `for (const x of iterable)` | `for` loop with index or `.forEach()` on arrays |
| `obj?.prop` | `if (obj) { obj.prop }` or a null check |
| `x ?? fallback` | `x !== null && x !== undefined ? x : fallback` |
| `JSON.parse(str)` | Manual string parsing or msgpack if available |

## Number Types on micro:bit V2

The micro:bit V2 target uses a runtime with **floating-point support**.
Both `number` (double-precision float) and integer arithmetic work
correctly. You do not need to worry about integer-only math on V2.

## Common Error Messages and STS Causes

| Error message (or pattern) | Likely STS cause |
|---|---|
| `Type 'any' is not assignable to...` | You used `any` — provide a concrete type |
| `Cannot find name 'Map'` / `'Set'` | `Map`/`Set` not available — use arrays |
| `Cannot find name 'Promise'` | `Promise` not available — use `control.inBackground()` |
| `Cannot find name 'JSON'` | `JSON` not available in STS |
| `Property does not exist on type...` after `?.` | Optional chaining not supported — use explicit null check |
| `Unexpected token '??'` | Nullish coalescing not supported — use ternary |
| `Cannot find module '...'` | ES modules not supported — use namespaces |
| `'async' modifier is not allowed here` | `async` not supported — use `control.inBackground()` |
| `Regular expression not supported` | Regex not available in STS |
| `Type 'IterableIterator<...>' is not an array type` | `for...of` only works on arrays |
