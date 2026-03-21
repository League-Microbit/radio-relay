---
id: "002"
title: "Implement scripts/build.js"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Implement scripts/build.js

## Description

Create `scripts/build.js` that sets required environment variables,
checks Docker preconditions for C++ projects, runs pxt build, and
reports the hex file location and size on success.

## Acceptance Criteria

- [x] Sets PXT_FORCE_LOCAL=1 and PXT_COMPILE_SWITCHES=csv---mbcodal
- [x] Checks for .cpp files in pxt.json and verifies Docker image
- [x] Errors with actionable message if Docker image missing
- [x] Runs npx pxt build
- [x] Reports hex file location (built/binary.hex) and size on success
- [x] Exits non-zero on failure
- [x] Uses child_process.execSync with stdio inherit

## Testing

- **Verification command**: `node scripts/build.js`
