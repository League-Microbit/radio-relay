---
id: "003"
title: "Write .gitignore and .env.example"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Write .gitignore and .env.example

## Description

Replace the existing .gitignore with one covering all PXT-generated artifacts
and create .env.example with bridge deployment variable placeholders.

## Acceptance Criteria

- [x] .gitignore covers built/, pxt_modules/, node_modules/, .pxt/, *.hex, *.d.ts, .env, .DS_Store
- [x] .env.example contains BRIDGE_URL and BRIDGE_KEY commented out

## Testing

- **Verification**: Files exist with correct content
