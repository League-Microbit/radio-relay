---
sprint: "003"
status: draft
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Architecture Update -- Sprint 003: npm Scripts & Build Pipeline

## What Changed

### New: `scripts/` directory with three build scripts

```
scripts/
├── setup.js    # npm run setup  -- project initialization
├── build.js    # npm run build  -- compile to .hex
└── deploy.js   # npm run deploy -- build + flash (bridge or USB)
```

Each script is a standalone Node.js entry point invoked by the corresponding
npm script in `package.json`. No shared module is strictly required, though
common patterns (command execution with error handling, pxt.json reading) may
be extracted to a local helper within `scripts/` if duplication warrants it.

### scripts/setup.js

Orchestrates first-time project setup. Steps run sequentially; failure at any
step halts execution with an actionable message.

```
npm install
  → pxt target microbit
    → pxt install
      → (if .cpp in pxt.json files) check/build Docker image
```

**Idempotency:** Every step is safe to re-run. `npm install` is idempotent.
`pxt target` and `pxt install` overwrite existing state. Docker image build
skips if image already exists.

**Docker image check:** Reads `pxt.json`, scans the `files` array for entries
ending in `.cpp`. If found, runs `docker images -q pxt/yotta` to check for
the image. If missing, runs `make` in the `docker/` directory. If Docker
itself is not available, prints a warning explaining that C++ compilation
will not work without Docker.

### scripts/build.js

Sets required environment variables and invokes `pxt build`.

**Environment variables set before build:**

| Variable | Value | Purpose |
|---|---|---|
| `PXT_FORCE_LOCAL=1` | Always | Disables cloud compiler; all builds are local |
| `PXT_COMPILE_SWITCHES=csv---mbcodal` | Always | Targets V2/CODAL only; skips V1/DAL build path |

**C++ precondition check:** Before invoking `pxt build`, if `.cpp` files are
detected in `pxt.json` `files`, the script verifies the `pxt/yotta` Docker
image exists. If missing, it fails immediately with a message directing the
student to run `npm run setup`. This prevents PXT from attempting C++
compilation without the required toolchain, which produces cryptic errors.

**Output on success:** Locates the `.hex` file in `built/`, prints its path
and file size in bytes. This gives the student immediate confirmation that the
build produced output.

### scripts/deploy.js

Builds the project, then deploys the hex file via one of two paths.

**Deploy decision logic:**

```
load .env (if present)
read BRIDGE_URL from environment
read BRIDGE_KEY from environment

if (BRIDGE_URL set AND BRIDGE_KEY set):
    POST hex to ${BRIDGE_URL}/api/hex
    Authorization header: ${BRIDGE_KEY}
    body: raw hex file bytes
    → print "Deployed via bridge"
else:
    run: pxt deploy
    → print "Deployed via USB (local)"

if (exactly one of BRIDGE_URL/BRIDGE_KEY is set):
    warn: "Only one bridge variable set; falling back to USB deploy.
           Set both BRIDGE_URL and BRIDGE_KEY for bridge deploy."
```

**Build-before-deploy:** The deploy script runs the build step first (either
by importing/requiring `build.js` logic or by invoking `node scripts/build.js`
as a subprocess). This ensures the hex file is always fresh. If the build
fails, deploy does not proceed.

**`.env` loading:** The script loads `.env` from the project root if it exists.
Environment variables already set in the shell take precedence over `.env`
values (standard `dotenv` behavior). If `.env` does not exist, the script
continues silently -- this is the normal case for students who have not
configured bridge access.

**HTTP POST implementation:** Uses Node.js built-in `https` (or `http`,
depending on the URL scheme) module. No external HTTP libraries. The hex file
is read as a Buffer and sent as the request body. Response status is checked:
2xx is success, anything else is reported as an error with the status code and
response body.

## Why

The project overview specifies npm scripts as the build system (Key Design
Decision #1). Students and the AI agent invoke `npm run setup/build/deploy`
rather than remembering PXT CLI invocations and environment variables. The
scripts encode the project's build knowledge -- correct environment variables,
precondition checks, deploy routing -- so it cannot be lost or forgotten.

The error handling requirements come directly from the design document: "Each
checks preconditions and gives actionable error messages on failure." Silent
failures are the primary source of wasted student time.

## Impact on Existing Components

### package.json

No changes to `package.json` itself -- the script stubs (`"setup": "node
scripts/setup.js"`, etc.) were created in Sprint 002. This sprint implements
the files those stubs point to.

**Potential addition:** If `.env` loading uses the `dotenv` npm package (rather
than a hand-rolled loader), `dotenv` must be added to `dependencies` in
`package.json`. This is the only possible package.json change.

### docker/

No changes to the Docker directory. `scripts/setup.js` invokes `make` in
`docker/` as a consumer -- it does not modify the Dockerfile or docker
Makefile.

### pxt.json

Read-only. Scripts read `pxt.json` to detect `.cpp` files in the `files`
array. No writes.

### .env / .env.example

Read-only. `scripts/deploy.js` reads `.env` for bridge configuration.
`.env.example` was created in Sprint 002 with commented-out placeholders.

### built/

Output directory. `scripts/build.js` reads from `built/` to locate and
report the hex file. `scripts/deploy.js` reads the hex file from `built/`
to POST to the bridge or pass to `pxt deploy`.

## Error Handling Patterns

All three scripts follow a consistent error handling pattern:

1. **Check precondition** (file exists, tool available, image present).
2. **If precondition fails:** print what is wrong and what the student should
   do, then `process.exit(1)`.
3. **Run command** via `child_process.execSync` with `{ stdio: 'inherit' }`
   so PXT output streams directly to the terminal.
4. **If command fails:** `execSync` throws on non-zero exit. Catch the error,
   print context about which step failed, then `process.exit(1)`.
5. **On success:** print a short confirmation message.

This pattern ensures:
- Students see PXT's own output in real time (not buffered).
- Failures are caught at the script level with added context.
- Exit codes propagate correctly for CI/automation use.

## Migration Concerns

None. This sprint adds new files only (`scripts/setup.js`, `scripts/build.js`,
`scripts/deploy.js`). No existing files are modified (except possibly
`package.json` if `dotenv` is added as a dependency). No data migration or
backward compatibility concerns.
