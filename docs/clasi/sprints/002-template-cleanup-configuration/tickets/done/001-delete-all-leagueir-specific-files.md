---
id: "001"
title: "Delete all LeagueIR-specific files"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Delete all LeagueIR-specific files

## Description

Delete all 13 LeagueIR-specific files from the repository: source files,
tests, generated type declarations, icon, dev docs, and root Makefile.

## Acceptance Criteria

- [x] All 13 LeagueIR-specific files deleted
- [x] src/main.ts, test/test.ts, docker/, .claude/, CLAUDE.md, README.md, LICENSE, docs/ retained

## Testing

- **Verification**: Confirmed files removed via `git rm`
