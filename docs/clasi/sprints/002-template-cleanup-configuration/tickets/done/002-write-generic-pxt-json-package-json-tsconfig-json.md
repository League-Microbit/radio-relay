---
id: "002"
title: "Write generic pxt.json, package.json, tsconfig.json"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Write generic pxt.json, package.json, tsconfig.json

## Description

Rewrite all three config files to define the generic "my-robot" template
identity with correct PXT configuration, npm script stubs, and TypeScript
compiler options.

## Acceptance Criteria

- [x] pxt.json rewritten with name "my-robot", public false, correct files/testFiles
- [x] package.json rewritten with pxt-microbit dependency and npm script stubs
- [x] tsconfig.json rewritten with ES5 target and correct excludes

## Testing

- **Verification**: All three files parse as valid JSON with correct content
