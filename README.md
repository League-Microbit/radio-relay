# micro:bit Starter Template

A ready-to-use template for BBC micro:bit V2 robotics projects using
Microsoft MakeCode (TypeScript).

## Quick Start

### Option 1: GitHub Codespaces (recommended)

1. Click **"Use this template"** → **"Create a new repository"**
2. Open your new repo and click **"Code"** → **"Codespaces"** → **"Create codespace"**
3. Wait for setup to complete (first time takes a few minutes)
4. Start editing `src/robot.ts` — that's where your code goes

### Option 2: Local Setup (macOS / Linux)

1. Click **"Use this template"** → **"Create a new repository"**
2. Clone your new repo
3. Run `npm run setup`
4. Start editing `src/robot.ts`

## Project Structure

| File | Purpose |
|---|---|
| `src/robot.ts` | **Your code goes here.** Add functions for your robot. |
| `src/main.ts` | Demo/test runner — calls your robot functions. Your library code goes in robot.ts. |
| `test/test.ts` | Test file — exercises your robot functions. |
| `pxt.json` | Project config. **Add new source files here** or they'll be ignored. |

## Build & Deploy

| Command | What it does |
|---|---|
| `npm run build` | Compile your code to a `.hex` file |
| `npm run deploy` | Build and flash to your micro:bit |
| `npm run test` | Build with test files included |
| `npm run setup` | Re-run setup (if something breaks) |

## Adding Extensions

To use a motor driver, sensor library, or other MakeCode extension:

1. Find the extension's GitHub URL (e.g., `microsoft/pxt-neopixel`)
2. Add it to `pxt.json` under `"dependencies"`:
   ```json
   "dependencies": {
       "core": "*",
       "neopixel": "microsoft/pxt-neopixel#v0.7.5"
   }
   ```
3. Run `npm run setup` to install it

## Adding New Files

**Important:** MakeCode requires every source file to be listed in `pxt.json`.

- New `.ts` files in `src/` → add to `"files"` array
- New `.ts` files in `test/` → add to `"testFiles"` array
- New `.cpp` files → add to `"files"` array

If you create a file but forget to add it to `pxt.json`, it will be
silently ignored. No error, no warning.

## Get Help

This project includes an AI coding assistant (Claude Code) that knows
how to work with MakeCode and micro:bit. Ask it:

- "How do I add a motor driver extension?"
- "Why am I getting this compiler error?"
- "How do I make my function show up as a block?"
- "Help me write code for the line follower challenge"

## License

MIT
