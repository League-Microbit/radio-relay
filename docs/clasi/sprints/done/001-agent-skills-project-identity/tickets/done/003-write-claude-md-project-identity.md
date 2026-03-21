---
id: "003"
title: "Write CLAUDE.md project identity"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Write CLAUDE.md project identity

## Description

Add project identity content to CLAUDE.md after the CLASI block, covering what the repo is, build commands, pxt.json rules, deploy behavior, skill pointers, and prohibited patterns.

## Acceptance Criteria

- [x] Project identity paragraph added after `<!-- CLASI:END -->` marker
- [x] Build commands table (setup, build, deploy, test, serve)
- [x] pxt.json rules: files array, testFiles array, .cpp in files, silent ignore warning
- [x] Deploy behavior: BRIDGE_URL/BRIDGE_KEY or pxt deploy
- [x] Skill pointers to static-typescript and pxt skills
- [x] "What not to do" section covering npm, ES modules, MicroPython, missing pxt.json entries, cloud compiler

## Testing

- **Existing tests to run**: N/A (documentation-only ticket)
- **New tests to write**: N/A
- **Verification command**: CLAUDE.md contains project identity after CLASI:END
