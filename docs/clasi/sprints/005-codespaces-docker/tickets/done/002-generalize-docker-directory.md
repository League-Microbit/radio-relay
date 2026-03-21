---
id: "002"
title: "Generalize docker/ directory"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Generalize docker/ directory

## Description

Fix the `pext/yotta` typo to `pxt/yotta` in the Makefile. Rewrite docker/README.md to be generic (not IR-specific), explaining the ARM cross-compilation image purpose.

## Acceptance Criteria

- [x] Makefile IMAGE_NAME fixed from `pext/yotta` to `pxt/yotta`
- [x] README.md rewritten as generic documentation for the cross-compilation image
- [x] Dockerfile verified as already generic (no changes needed)

## Testing

- **Verification**: `cd docker && make info` should reference `pxt/yotta`.
