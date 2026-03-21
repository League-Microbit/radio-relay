---
sprint: "001"
status: draft
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Architecture Update -- Sprint 001: Agent Skills & Project Identity

## What Changed

Four new documentation files are added to the repository. No existing
files are modified or deleted. No code, configuration, or build system
changes occur in this sprint.

### New Files

```
CLAUDE.md                                      # Project identity & agent guardrails
.claude/skills/static-typescript/SKILL.md      # STS language constraints skill
.claude/skills/pxt/SKILL.md                    # PXT framework patterns skill
.claude/skills/pxt/references/block-annotations.md  # Detailed //% annotation reference
```

### New Directories

```
.claude/skills/static-typescript/    # New
.claude/skills/pxt/                  # New
.claude/skills/pxt/references/       # New
```

Note: `.claude/` already exists (it contains the CLASI process rules).
The `skills/` subdirectory and its children are new.

### File Descriptions

**CLAUDE.md** — The project root instruction file that Claude Code reads
automatically at the start of every conversation. Contains six sections:

1. Project identity (what this repo is, who it's for, target hardware)
2. Build commands (npm run setup/build/deploy/test/clean)
3. pxt.json rules (file registration, files vs testFiles)
4. Deploy behavior (bridge vs local USB)
5. Skill pointers (when to consult which skill)
6. What not to do (common agent mistakes to avoid)

The existing CLAUDE.md contains CLASI process instructions. The project
identity content will be added to the same file (prepended or merged)
so both sets of instructions coexist. The CLASI section remains intact.

**.claude/skills/static-typescript/SKILL.md** — Reference for Static
TypeScript, the restricted TypeScript subset used by MakeCode/PXT.
Covers disallowed features, recommended workarounds, and a mapping of
cryptic compiler error messages to their STS root causes.

**.claude/skills/pxt/SKILL.md** — Reference for MakeCode/PXT framework
conventions. Covers namespace patterns, block annotations (summary),
C++ shim conventions, the files/testFiles split in pxt.json, and
extension authoring for classroom sharing.

**.claude/skills/pxt/references/block-annotations.md** — Deep-dive
reference for the `//%` block annotation system. Documents all annotation
keys (`block`, `blockId`, `weight`, `group`, `color`, `icon`, parameter
annotations, enums) with examples. Loaded by the agent only when
actively working on block definitions, to avoid context bloat.

## Why

The agent (Claude Code) is the primary way students get help with this
project. Without project-specific skills, the agent:

- Suggests standard TypeScript features that fail in Static TypeScript
- Suggests npm packages that cannot be used in MakeCode projects
- Creates .ts files without registering them in pxt.json
- Does not know about block annotations, C++ shims, or the
  files/testFiles distinction

These are the most common sources of student frustration. By encoding
this knowledge in agent skills before any code changes (Sprints 2-6),
the agent is useful from the start and avoids introducing errors during
the template conversion itself.

This sprint is deliberately first in the roadmap so that the agent has
correct knowledge for all subsequent sprints.

## Impact on Existing Components

**Minimal.** This sprint adds documentation files only.

- No source code is changed.
- No build configuration is changed.
- No dependencies are added or removed.
- The existing `.claude/rules/` directory is untouched.
- The existing CLAUDE.md gains new content (project identity sections)
  prepended before the existing CLASI process section.

The only structural consideration is the CLAUDE.md merge: the project
identity sections must not interfere with the CLASI process instructions
that follow. Both use heading-based organization, so they coexist
naturally as separate top-level sections in the same file.

## Migration Concerns

None. This sprint adds new files to a repository that has not yet been
converted from its LeagueIR origin. There are no consumers, no deployed
instances, and no backward compatibility constraints. The files added
here will be used by all subsequent sprints.
