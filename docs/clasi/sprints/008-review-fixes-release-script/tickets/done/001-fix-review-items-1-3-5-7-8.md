---
id: "001"
title: "Fix review items 1-3, 5, 7-8"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---

# Fix review items 1-3, 5, 7-8

## Description

Fix multiple review items from sprint review: update CLAUDE.md build commands to npm run, delete DOCKER_SETUP.md, replace .vscode/tasks.json with npm run tasks, fix README main.ts description, add .gitignore comment, and minor cleanup (build.js comment, .DS_Store removal, version reset).

## Acceptance Criteria

- [x] CLAUDE.md build commands table uses npm run
- [x] docker/DOCKER_SETUP.md deleted
- [x] .vscode/tasks.json uses npm run commands
- [x] .vscode/tasks.json.old and c_cpp_properties.json deleted
- [x] README main.ts description updated
- [x] .gitignore *.d.ts has explanatory comment
- [x] scripts/build.js has CODAL comment
- [x] .DS_Store files removed from tracking
- [x] package.json version reset to 0.1.0

## Testing

- **Verification**: All changes are documentation/config only, no runtime impact.
