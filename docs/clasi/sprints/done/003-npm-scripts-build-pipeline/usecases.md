---
status: draft
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 003 Use Cases

## SUC-003-01: Student runs npm run setup on fresh clone

Parent: (none -- new capability)

- **Actor**: Student (or Codespace `postCreateCommand`)
- **Preconditions**:
  - Node.js and npm are installed.
  - The repository has been cloned or created from the template.
  - `package.json` exists with `"setup": "node scripts/setup.js"`.
  - No prior setup has been run (`node_modules/`, `pxt_modules/` may not exist).
- **Main Flow**:
  1. Student runs `npm run setup`.
  2. Script runs `npm install` to install Node.js dependencies.
  3. Script runs `pxt target microbit` to set the PXT target.
  4. Script runs `pxt install` to install PXT dependencies (creates `pxt_modules/`).
  5. Script reads `pxt.json` `files` array and checks for `.cpp` file entries.
  6. If `.cpp` files are present, script checks whether the `pxt/yotta` Docker
     image exists locally (`docker images -q pxt/yotta`).
  7. If the image is missing, script runs `cd docker && make` to build it.
  8. Script prints a summary of what was installed and any warnings.
- **Postconditions**:
  - `node_modules/` exists with PXT and dependencies.
  - `pxt_modules/` exists with the micro:bit target libraries.
  - If `.cpp` files are present, the `pxt/yotta` Docker image exists.
  - The project is ready for `npm run build`.
- **Acceptance Criteria**:
  - [ ] `npm run setup` succeeds on a fresh clone with Node.js installed
  - [ ] Running `npm run setup` a second time succeeds (idempotent)
  - [ ] Each step (npm install, pxt target, pxt install) reports success or failure independently
  - [ ] If `npm install` fails, the script exits with non-zero status and an actionable message
  - [ ] If `pxt target microbit` fails, the script exits with non-zero status and an actionable message
  - [ ] If `.cpp` files are present and Docker is not available, the script warns clearly

## SUC-003-02: Student builds project with npm run build

Parent: (none -- new capability)

- **Actor**: Student
- **Preconditions**:
  - `npm run setup` has been run successfully.
  - `pxt_modules/` and `node_modules/` exist.
  - `pxt.json` is valid.
- **Main Flow**:
  1. Student runs `npm run build`.
  2. Script sets `PXT_FORCE_LOCAL=1` in the environment.
  3. Script sets `PXT_COMPILE_SWITCHES=csv---mbcodal` in the environment.
  4. If `.cpp` files are listed in `pxt.json` `files`, script checks for the
     `pxt/yotta` Docker image before proceeding.
  5. Script runs `pxt build`.
  6. On success, script locates the `.hex` file in `built/`, reports its path
     and file size.
- **Postconditions**:
  - A `.hex` file exists in `built/`.
  - The student sees the hex file path and size printed to stdout.
- **Acceptance Criteria**:
  - [ ] `npm run build` produces a `.hex` file in `built/`
  - [ ] The hex file path and size are printed to stdout
  - [ ] `PXT_FORCE_LOCAL=1` is set during the build (no cloud compiler)
  - [ ] `PXT_COMPILE_SWITCHES=csv---mbcodal` is set during the build (V2 only)
  - [ ] Build exits with non-zero status on PXT build failure
  - [ ] PXT build errors are passed through to the student (not swallowed)

## SUC-003-03: Student deploys via USB with npm run deploy

Parent: (none -- new capability)

- **Actor**: Student with micro:bit connected via USB
- **Preconditions**:
  - `npm run setup` has been run successfully.
  - `BRIDGE_URL` and `BRIDGE_KEY` are NOT set in environment or `.env`.
  - A micro:bit is connected via USB (for `pxt deploy` to find it).
- **Main Flow**:
  1. Student runs `npm run deploy`.
  2. Script runs the build step first (same as `npm run build`).
  3. Script checks for `BRIDGE_URL` and `BRIDGE_KEY` in environment and `.env`.
  4. Neither variable is set, so script runs `pxt deploy` for local USB flash.
  5. Script prints: "Deployed via USB (local)." (or similar message indicating
     which path was used).
- **Postconditions**:
  - The hex file has been flashed to the micro:bit via USB.
  - The student knows deployment used the USB path.
- **Acceptance Criteria**:
  - [ ] Deploy script builds before deploying (does not deploy stale hex)
  - [ ] When env vars are missing, `pxt deploy` is invoked
  - [ ] The script prints which deploy path was used (USB/local)
  - [ ] If the build step fails, deploy does not proceed
  - [ ] Exit status is non-zero if build or deploy fails

## SUC-003-04: Student deploys via bridge when env vars set

Parent: (none -- new capability)

- **Actor**: Student in Codespace (or any environment with bridge configured)
- **Preconditions**:
  - `npm run setup` has been run successfully.
  - `BRIDGE_URL` and `BRIDGE_KEY` are set (either in environment or in `.env`).
  - The bridge service is running and reachable at `BRIDGE_URL`.
- **Main Flow**:
  1. Student runs `npm run deploy`.
  2. Script runs the build step first.
  3. Script loads `.env` if present, then checks environment for `BRIDGE_URL`
     and `BRIDGE_KEY`.
  4. Both variables are set. Script reads the hex file from `built/`.
  5. Script POSTs the hex file body to `${BRIDGE_URL}/api/hex` with header
     `Authorization: ${BRIDGE_KEY}`.
  6. Script checks the HTTP response status.
  7. On success (2xx), script prints: "Deployed via bridge (BRIDGE_URL)."
  8. On failure (non-2xx or network error), script prints the error and exits
     with non-zero status.
- **Postconditions**:
  - The hex file has been sent to the bridge service.
  - The student knows deployment used the bridge path and whether it succeeded.
- **Acceptance Criteria**:
  - [ ] When both `BRIDGE_URL` and `BRIDGE_KEY` are set, the hex is POSTed to the bridge
  - [ ] The POST goes to `${BRIDGE_URL}/api/hex`
  - [ ] The `Authorization` header is set to `${BRIDGE_KEY}`
  - [ ] The request body is the raw hex file bytes
  - [ ] The script prints which deploy path was used (bridge)
  - [ ] HTTP errors (non-2xx) produce an actionable error message
  - [ ] Network errors (unreachable bridge) produce an actionable error message
  - [ ] If only one of the two env vars is set, the script falls back to USB and warns

## SUC-003-05: Build fails clearly when Docker image missing for C++ project

Parent: (none -- new capability)

- **Actor**: Student working on a project that includes `.cpp` files
- **Preconditions**:
  - `pxt.json` `files` array contains one or more `.cpp` file entries.
  - The `pxt/yotta` Docker image does NOT exist locally.
  - `npm run setup` was either not run or was run before `.cpp` files were added.
- **Main Flow**:
  1. Student runs `npm run build`.
  2. Script reads `pxt.json` and detects `.cpp` files in the `files` array.
  3. Script checks for the `pxt/yotta` Docker image (`docker images -q pxt/yotta`).
  4. Image is not found. Script prints an error:
     "C++ compilation requires the pxt/yotta Docker image. Run `npm run setup`
     to build it."
  5. Script exits with non-zero status without attempting the build.
- **Postconditions**:
  - No build was attempted (avoids cryptic PXT/Docker errors).
  - The student knows exactly what to do: run `npm run setup`.
- **Acceptance Criteria**:
  - [ ] Build script detects `.cpp` files in `pxt.json` `files` array
  - [ ] Build script checks for `pxt/yotta` Docker image before invoking `pxt build`
  - [ ] When image is missing, the error message names the image and the fix (`npm run setup`)
  - [ ] The script exits with non-zero status
  - [ ] The build is NOT attempted (no cryptic downstream errors)
