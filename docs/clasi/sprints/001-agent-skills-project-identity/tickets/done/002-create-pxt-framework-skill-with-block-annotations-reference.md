---
id: "002"
title: "Create PXT framework skill with block-annotations reference"
status: done
use-cases: []
depends-on: []
github-issue: ""
todo: ""
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Create PXT framework skill with block-annotations reference

## Description

Create `.claude/skills/pxt/SKILL.md` covering PXT namespace conventions, block annotations, C++ shim pattern, files/testFiles split, and extension authoring. Create `.claude/skills/pxt/references/block-annotations.md` as a detailed annotation reference.

## Acceptance Criteria

- [x] SKILL.md created at `.claude/skills/pxt/SKILL.md`
- [x] YAML frontmatter with name and description
- [x] Namespace convention documented (all code in namespaces, `robot` default)
- [x] Block annotations overview with essential annotations table
- [x] C++ shim pattern documented with examples
- [x] files vs testFiles split explained
- [x] Extension authoring guidance included
- [x] `references/block-annotations.md` created with full annotation reference
- [x] Block annotations reference covers all `//%` options with examples

## Testing

- **Existing tests to run**: N/A (documentation-only ticket)
- **New tests to write**: N/A
- **Verification command**: Files exist and contain expected sections
