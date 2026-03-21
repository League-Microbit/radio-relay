---
id: "001"
title: "Implement scripts/setup.js"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Implement scripts/setup.js

## Description

Create `scripts/setup.js` that orchestrates project setup: npm install,
pxt target microbit, pxt install, and conditional Docker image build for
C++ projects. Each step reports success/failure independently. The script
is idempotent and exits non-zero on failure.

## Acceptance Criteria

- [x] Runs `npm install`
- [x] Runs `npx pxt target microbit`
- [x] Runs `npx pxt install`
- [x] Checks pxt.json files array for .cpp files
- [x] If .cpp files found, checks for pxt/yotta Docker image
- [x] If Docker image missing, runs `cd docker && make`
- [x] Each step reports success/failure independently
- [x] Idempotent (safe to run multiple times)
- [x] Uses child_process.execSync with stdio inherit
- [x] Exits with non-zero code on failure

## Testing

- **Verification command**: `node scripts/setup.js`
