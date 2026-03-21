---
id: "003"
title: "npm Scripts & Build Pipeline"
status: done
branch: sprint/003-npm-scripts-build-pipeline
use-cases:
  - SUC-003-01
  - SUC-003-02
  - SUC-003-03
  - SUC-003-04
  - SUC-003-05
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 003: npm Scripts & Build Pipeline

## Goals

Implement the three core build scripts (`scripts/setup.js`, `scripts/build.js`,
`scripts/deploy.js`) that form the project's build pipeline. Each script must
have real error handling, precondition checks, and actionable failure messages
so that students (and the AI agent) never encounter silent failures or cryptic
errors.

After this sprint, `npm run setup && npm run build && npm run deploy` is a
working end-to-end pipeline from fresh clone to hex on device (or bridge).

## Problem

Sprint 002 created `package.json` with script stubs that invoke
`node scripts/setup.js`, `node scripts/build.js`, and `node scripts/deploy.js`,
but those JS files do not exist yet. The npm commands fail immediately. Students
cannot set up, build, or deploy their projects.

The underlying PXT CLI commands (`pxt target`, `pxt install`, `pxt build`,
`pxt deploy`) must be run with specific environment variables and in a specific
order. Without wrapper scripts, students must remember the correct invocations,
environment variables (`PXT_FORCE_LOCAL=1`, `PXT_COMPILE_SWITCHES=csv---mbcodal`),
and precondition checks (Docker image for C++, bridge env vars for remote
deploy). This is error-prone and undiscoverable.

## Solution

Create three JS scripts in `scripts/` that wrap PXT CLI commands with:

1. **Precondition checks** -- verify that required tools, files, and images
   exist before attempting operations.
2. **Environment variable management** -- set `PXT_FORCE_LOCAL=1` and
   `PXT_COMPILE_SWITCHES=csv---mbcodal` automatically so students never need
   to know about them.
3. **Actionable error messages** -- every failure path prints what went wrong
   and what the student should do to fix it.
4. **Bridge integration** -- deploy script reads `BRIDGE_URL`/`BRIDGE_KEY`
   from environment or `.env` file and routes deployment accordingly.

Scripts use only Node.js built-in modules (`child_process`, `fs`, `path`,
`http`/`https`) plus `dotenv` for `.env` loading. No other dependencies.

## Success Criteria

- `npm run setup` completes successfully on a fresh clone (given Node.js and
  npm are installed), installing PXT, the micro:bit target, and project
  dependencies.
- `npm run build` produces a `.hex` file in `built/` and reports its location
  and size.
- `npm run deploy` builds first, then either POSTs to bridge (when env vars
  set) or runs `pxt deploy` (when env vars missing), printing which path was
  used.
- When `.cpp` files are present in `pxt.json` `files` but the `pxt/yotta`
  Docker image is missing, `npm run build` fails with a clear message directing
  the student to run `npm run setup`.
- When `npm run setup` detects `.cpp` files and no Docker image, it
  automatically builds the image via `cd docker && make`.
- All scripts exit with non-zero status on failure.
- All error messages include the specific remediation step.

## Scope

### In Scope

- `scripts/setup.js` -- npm install, pxt target microbit, pxt install,
  conditional Docker image build
- `scripts/build.js` -- environment setup, pxt build, hex reporting, Docker
  image check for C++ projects
- `scripts/deploy.js` -- build first, .env loading, bridge POST or pxt deploy
  fallback
- Shared utility functions (if any) within `scripts/`
- `.env` file loading via `dotenv` (added as a dependency if not already
  present, or implemented manually with `fs.readFileSync`)

### Out of Scope

- `npm run test` (passthrough to `pxt test`, no wrapper script needed)
- `npm run serve` (passthrough to `pxt serve`, no wrapper script needed)
- `npm run clean` (inline `rm -rf` in package.json, no wrapper script needed)
- Changes to `pxt.json`, `tsconfig.json`, or source files
- The bridge server itself (separate project)
- Docker image contents or Dockerfile changes
- Changes to `.devcontainer/devcontainer.json`
- The `scripts/` directory creation itself (assumed to exist or trivially
  created)

## Dependencies

- **Sprint 002 (Template Cleanup & Configuration)** must be complete. This
  sprint depends on:
  - `package.json` with script stubs (`"setup": "node scripts/setup.js"`, etc.)
  - `pxt.json` with the generic template configuration
  - `.env.example` with `BRIDGE_URL` and `BRIDGE_KEY` placeholders
  - `.gitignore` including `.env`
  - The `docker/` directory with Dockerfile and Makefile

## Test Strategy

Testing is primarily manual/integration since these scripts orchestrate
external tools (PXT CLI, Docker, HTTP):

1. **Setup script** -- Run on a fresh clone. Verify `node_modules/`,
   `pxt_modules/`, and `.pxt/` directories are created. Run again to verify
   idempotency.
2. **Build script** -- Run after setup. Verify `.hex` file appears in `built/`.
   Verify correct environment variables are set. Verify error message when
   Docker image is missing (for a project with `.cpp` files).
3. **Deploy script** -- Test both paths:
   - Without env vars: verify `pxt deploy` is invoked.
   - With env vars set: verify HTTP POST is attempted to the correct URL with
     the correct headers.
4. **Error paths** -- Verify each precondition check produces the expected
   error message and non-zero exit code.

## Architecture Notes

- Scripts use `child_process.execSync` for subprocess invocation (synchronous
  is appropriate -- these are sequential build steps, not a server).
- Each script is a standalone entry point (`node scripts/X.js`). No shared
  module is required, but common patterns (like running a command with error
  handling) may be extracted to a helper if duplication is excessive.
- `.env` loading: use `dotenv` package or a minimal hand-rolled loader. The
  design doc lists `dotenv` as acceptable. Decision deferred to implementation.
- Bridge POST uses Node.js built-in `https` (or `http`) module -- no `fetch`
  polyfill or external HTTP library.
- All scripts target Node.js 18+ (the `fs.readFileSync`, `child_process`,
  `path`, `https` APIs are stable and available).

## GitHub Issues

(None linked.)

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [x] Sprint planning documents are complete (sprint.md, use cases, architecture)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Tickets

(To be created after sprint approval.)
