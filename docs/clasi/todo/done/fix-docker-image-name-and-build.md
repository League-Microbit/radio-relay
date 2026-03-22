---
status: in-progress
sprint: 009
tickets:
- 009-001
---

# Fix Docker Image Name and Build Pipeline

## Problem

The build pipeline has three issues discovered during first actual `pxt build`:

### 1. Docker image name mismatch

PXT's `pxtarget.json` (in `node_modules/pxt-microbit`) hardcodes
`pext/yotta:latest` as the Docker image name. This is not a typo — it's
the actual upstream convention. In Sprint 005 we "fixed" the Makefile
from `pext/yotta` to `pxt/yotta`, but this broke the build because PXT
doesn't look for `pxt/yotta`.

**Affected files:**
- `docker/Makefile` — currently says `pxt/yotta`, should be `pext/yotta`
- `docker/README.md` — references `pxt/yotta`
- `scripts/setup.js` — checks for `pxt/yotta` Docker image
- `scripts/build.js` — checks for `pxt/yotta` Docker image

**Fix:** Revert all references to `pext/yotta` to match what PXT expects.

### 2. Compile error in demo program

`src/main.ts` uses `input.soundLevel()` which doesn't exist in
pxt-microbit v8. The build fails with:
```
src/main.ts(20,23): error TS2339: Property 'soundLevel' does not exist on type 'typeof input'.
```

**Fix:** Replace the touch logo handler with something that compiles.
Options: use `input.lightLevel()` again, show temperature, or show a
different animation. The point is just to demonstrate touch logo input.

### 3. Release script should also tag `pext/yotta`

The `scripts/release.sh` doesn't touch Docker config. Not a problem for
release, but worth noting that the image name inconsistency propagates
to student-facing docs if not fixed.

## Verification

After fixes, this should succeed:
```bash
npm run setup    # builds pext/yotta Docker image if needed
npm run build    # compiles to built/binary.hex with no errors
npm run lint     # all files listed in pxt.json
```
