---
id: '001'
title: Revert Docker image name to pext/yotta everywhere
status: done
use-cases: []
depends-on: []
github-issue: ''
todo: fix-docker-image-name-and-build.md
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Revert Docker image name to pext/yotta everywhere

## Description

(What needs to be done and why.)

## Acceptance Criteria

- [x] All references to pxt/yotta changed to pext/yotta in docker/Makefile, docker/README.md, scripts/setup.js, scripts/build.js

## Testing

- **Existing tests to run**: (list test files/commands to verify no regressions)
- **New tests to write**: (describe tests that validate this ticket's changes)
- **Verification command**: `uv run pytest`
