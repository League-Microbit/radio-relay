---
id: "002"
title: "Create release script to strip CLASI artifacts"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---

# Create release script to strip CLASI artifacts

## Description

Create scripts/release.sh that strips all CLASI development artifacts so the repo is clean for student distribution. The script is idempotent and reports what was removed.

## Acceptance Criteria

- [x] scripts/release.sh exists and is executable
- [x] Deletes docs/clasi/, .mcp.json, .vscode/mcp.json, .claude/rules/, .claude/settings*.json, docs/inital_planning/
- [x] Keeps .claude/skills/
- [x] Strips CLASI:START through CLASI:END block from CLAUDE.md
- [x] Removes docs/ if empty after cleanup
- [x] Prints what was removed
- [x] Idempotent (safe to run multiple times)
- [x] Added to package.json as "release" script

## Testing

- **Verification**: Script is bash with set -euo pipefail. Manual review of logic confirms correctness.
