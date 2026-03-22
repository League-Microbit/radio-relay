---
id: "002"
title: "Add pxt.json file-list lint script"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---

# Add pxt.json file-list lint script

## Description

Created `scripts/lint-pxt-files.js`, a zero-dependency Node.js script that
verifies pxt.json `files` and `testFiles` arrays match actual files on disk.

## Acceptance Criteria

- [x] Script reads pxt.json and parses files/testFiles arrays
- [x] Scans src/ for .ts and .cpp files, test/ for .ts files
- [x] Enforces rules: src/*.ts (except main.ts) in files, src/main.ts in testFiles, test/*.ts in testFiles
- [x] Reports missing files with clear error messages
- [x] Exits 0 on pass, 1 on failure
- [x] Warns (non-fatal) about phantom entries in pxt.json

## Testing

- **Verification command**: `node scripts/lint-pxt-files.js`
