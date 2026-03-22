---
id: "001"
title: "Add GitHub Actions CI workflow for pxt build"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---

# Add GitHub Actions CI workflow for pxt build

## Description

Created `.github/workflows/build.yml` with a full CI pipeline for pxt
builds on push/PR to main. Also added `lint` script to `package.json`.

## Acceptance Criteria

- [x] CI workflow file created at .github/workflows/build.yml
- [x] Triggers on push and PR to main branch
- [x] Uses Node 22, installs deps, sets up PXT target
- [x] Runs pxt.json file-list lint step
- [x] Builds with pxt build using PXT_FORCE_LOCAL and PXT_COMPILE_SWITCHES
- [x] Verifies built/binary.hex output exists
- [x] package.json has "lint" script entry

## Testing

- **Verification**: Push to main or open a PR to trigger the workflow
