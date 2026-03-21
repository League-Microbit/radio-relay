---
id: "003"
title: "Implement scripts/deploy.js"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Implement scripts/deploy.js

## Description

Create `scripts/deploy.js` that runs the build first, loads BRIDGE_URL
and BRIDGE_KEY from environment and .env file, POSTs hex to bridge when
both are set, or falls back to pxt deploy for local USB flash.

## Acceptance Criteria

- [x] Runs build first (executes scripts/build.js)
- [x] Reads BRIDGE_URL and BRIDGE_KEY from environment
- [x] Loads .env file if it exists (simple KEY=VALUE parser, no deps)
- [x] If both set: POSTs hex to ${BRIDGE_URL}/api/hex with Authorization header
- [x] If either missing: runs npx pxt deploy
- [x] Prints which deploy path was used
- [x] Uses Node.js built-in http/https module
- [x] Exits non-zero on failure

## Testing

- **Verification command**: `node scripts/deploy.js`
