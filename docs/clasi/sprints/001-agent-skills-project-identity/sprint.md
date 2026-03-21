---
id: "001"
title: "Agent Skills & Project Identity"
status: done
branch: sprint/001-agent-skills-project-identity
use-cases:
  - SUC-001-01
  - SUC-001-02
  - SUC-001-03
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 001: Agent Skills & Project Identity

## Goals

Establish the AI agent's knowledge base so it can effectively assist
students from the very first interaction. This sprint creates three
skill/configuration files that encode project identity, Static TypeScript
constraints, and MakeCode/PXT framework patterns. After this sprint, the
agent understands what this project is, what language subset students
write in, and how the PXT build system works.

## Problem

The repository is being converted from a LeagueIR extension into a
generic student robotics template. The AI agent (Claude Code) has no
project-specific knowledge — it does not know that TypeScript here means
Static TypeScript (a restricted subset), that pxt.json must be kept in
sync with source files, that npm packages are not usable, or how block
annotations work. Without this knowledge, the agent will give students
advice that causes confusing build failures.

## Solution

Create three documentation artifacts that the agent loads automatically:

1. **CLAUDE.md** (project root) — Project identity, build commands,
   pxt.json rules, deploy behavior, skill pointers, and guardrails
   ("what not to do").

2. **.claude/skills/static-typescript/SKILL.md** — Comprehensive
   reference for Static TypeScript constraints: disallowed features,
   workarounds, common error message mappings.

3. **.claude/skills/pxt/SKILL.md** — MakeCode/PXT framework patterns:
   namespace conventions, block annotations, C++ shim pattern,
   files/testFiles split, extension authoring. Includes a detailed
   sub-reference at `references/block-annotations.md`.

These are pure documentation files — no code changes, no build system
changes, no configuration changes.

## Success Criteria

1. CLAUDE.md exists at project root and contains all six required
   sections (project identity, build commands, pxt.json rules, deploy
   behavior, skill pointers, what not to do).
2. `.claude/skills/static-typescript/SKILL.md` exists with valid YAML
   frontmatter and covers disallowed features, workarounds, and error
   mappings.
3. `.claude/skills/pxt/SKILL.md` exists with valid YAML frontmatter and
   covers namespace conventions, block annotations, C++ shims,
   files/testFiles split, and extension authoring.
4. `.claude/skills/pxt/references/block-annotations.md` exists with a
   scannable reference of all `//%` annotation options with examples.
5. An agent reading these files can correctly answer: "Can I use
   async/await?", "How do I make a function show up as a block?",
   "I created a new .ts file but it's not compiling — why?".

## Scope

### In Scope

- Creating `CLAUDE.md` at project root (new file — the existing
  CLAUDE.md is the CLASI process file and will be replaced with the
  project identity file)
- Creating `.claude/skills/static-typescript/SKILL.md`
- Creating `.claude/skills/pxt/SKILL.md`
- Creating `.claude/skills/pxt/references/block-annotations.md`

### Out of Scope

- Code changes of any kind (no .ts, .js, .cpp, .json files modified)
- Build system changes (no package.json, no scripts/)
- Template cleanup (deleting IR-specific files — that is Sprint 2)
- Codespaces or Docker configuration
- README.md (student-facing docs — that is Sprint 6)
- Testing (there is nothing to test; these are documentation files)

## Test Strategy

This sprint produces only documentation/skill files. There is no code
to test. Validation is structural:

- Verify each file exists at the expected path.
- Verify YAML frontmatter in skill files parses correctly.
- Verify CLAUDE.md contains all six required sections.
- Manual review: confirm content accuracy against the design document
  (MbTemplateDesignV2.md) and MakeCode documentation.

## Architecture Notes

This sprint adds files only — no existing files are modified or deleted.
The `.claude/skills/` directory structure follows Claude Code's
convention for project-local skills. CLAUDE.md follows Claude Code's
convention for project-level instructions.

Key design decision: expertise lives in agent skills, not in
student-facing documentation. The README (Sprint 6) will say "ask the
agent" rather than documenting STS constraints or PXT patterns. This
keeps the student experience simple and the knowledge maintainable in
one place.

The existing CLAUDE.md (CLASI process file) will need to be reconciled.
The project identity content will be prepended or merged so both the
CLASI process instructions and the project-specific instructions coexist
in a single CLAUDE.md. The exact merge strategy is a ticket-level
decision.

## GitHub Issues

None — this is the foundational sprint.

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [ ] Sprint planning documents are complete (sprint.md, use cases, architecture)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Tickets

(To be created after sprint approval.)
