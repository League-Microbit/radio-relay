---
id: "002"
title: "Write test/test.ts exerciser"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Write test/test.ts exerciser

## Description

Create a minimal test exerciser that calls robot.driveForward(), writes a serial confirmation, and shows a checkmark. Validates that the robot namespace compiles and its exported functions are callable.

## Acceptance Criteria

- [x] test/test.ts calls robot.driveForward(500)
- [x] test/test.ts writes serial confirmation line
- [x] test/test.ts is in pxt.json testFiles

## Testing

- **Verification**: File compiles as part of `npm run build`
