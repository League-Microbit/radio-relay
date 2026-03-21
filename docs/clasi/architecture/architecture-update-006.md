---
sprint: "006"
status: draft
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Architecture Update -- Sprint 006: Documentation, Deploy & Template Config

## What Changed

### 1. README.md — Student-Facing Documentation

A new `README.md` replaces the old IR-specific README. Structure:

```
README.md
├── Project title and one-line description
├── Prerequisites
│   ├── GitHub account
│   ├── micro:bit V2 board
│   └── (Optional) Node.js 22 for local development
├── Quick Start
│   ├── Codespaces path (preferred)
│   │   ├── "Use this template" → "Open in Codespaces"
│   │   └── Setup runs automatically via postCreateCommand
│   ├── Local path
│   │   ├── Clone, npm run setup, npm run build
│   │   └── Docker required if using C++ shims
│   └── Verify: npm run build → .hex file in built/
├── Ask the AI Agent
│   ├── What Claude Code can help with
│   ├── Example prompts students can try
│   └── Pointer to .claude/skills/ for what the agent knows
├── Adding Extensions
│   ├── How to add a classmate's repo as a dependency
│   ├── Updating pxt.json dependencies
│   └── Running npm run setup after adding
├── Deploying to Your micro:bit
│   ├── Local USB: npm run deploy (default)
│   ├── Bridge: configure .env, npm run deploy
│   └── Manual: copy .hex from built/ to MICROBIT drive
├── Project Structure
│   └── Brief file tree with one-line descriptions
└── License
```

The README is intentionally concise. The AI agent is the primary help
resource, not documentation. The README gets students started and points
them to the agent for deeper questions.

### 2. GitHub Template Repository Configuration

The repository settings are updated to enable "Template repository". This
is a GitHub setting, not a file change. Effects:

- A green "Use this template" button appears on the repo page.
- Students who create repos from the template get a clean copy with no
  fork relationship and no shared commit history.
- The template's issues, PRs, and branch protection are not inherited.

No file changes are required for this. It is a checkbox in
Settings > General > "Template repository".

### 3. Deploy Script Bridge Integration Validation

No code changes to `scripts/deploy.js` — the bridge integration was
implemented in Sprint 003. This sprint validates the integration works
end-to-end:

- **Bridge path:** `.env` with `BRIDGE_URL` and `BRIDGE_KEY` set, deploy
  script POSTs hex to `${BRIDGE_URL}/api/hex`.
- **Fallback path:** No `.env` or missing variables, deploy script runs
  `pxt deploy` for local USB flash.
- **Validation:** Both paths are tested; script output confirms which
  path was taken.

### 4. End-to-End Validation Process

A manual validation checklist (not automated CI) confirms the template
works from scratch:

1. Fresh clone (or "Use this template" on GitHub)
2. `npm run setup` — installs Node deps, PXT target, PXT deps
3. `npm run build` — compiles TypeScript to `.hex`
4. Verify `built/` contains a `.hex` file (> 1 KB)
5. `npm run deploy` — flashes via bridge or USB
6. `npm run test` — compiles with test files included

### 5. Final File Manifest

The completed template repository contains exactly these files:

```
mb-template/
├── CLAUDE.md                           # Agent project identity
├── README.md                           # Student-facing documentation [NEW]
├── LICENSE                             # MIT license
├── pxt.json                            # MakeCode project config
├── tsconfig.json                       # TypeScript config
├── package.json                        # npm scripts
├── package-lock.json                   # Lockfile
├── .gitignore                          # Build artifacts, .env, etc.
├── .env.example                        # Bridge config placeholders
│
├── src/
│   ├── main.ts                         # Demo program (in testFiles)
│   └── robot.ts                        # Student namespace (in files)
│
├── test/
│   └── test.ts                         # Minimal test exerciser
│
├── scripts/
│   ├── setup.js                        # npm run setup
│   ├── build.js                        # npm run build
│   └── deploy.js                       # npm run deploy
│
├── docker/
│   ├── Dockerfile                      # ARM cross-compilation image
│   ├── Makefile                        # Builds pxt/yotta image
│   └── README.md                       # Docker usage notes
│
├── .claude/
│   ├── skills/
│   │   ├── static-typescript/
│   │   │   └── SKILL.md                # STS language constraints
│   │   └── pxt/
│   │       ├── SKILL.md                # Framework patterns
│   │       └── references/
│   │           └── block-annotations.md
│   └── (se process files excluded from template)
│
├── .devcontainer/
│   └── devcontainer.json               # Codespaces config
│
└── .vscode/
    └── settings.json                   # Editor settings
```

Files that should NOT be in the repo (verified by cleanup):
- No `src/ir.ts`, `src/ir.cpp`, `src/irpacket.ts`, `src/lib.ts`, `src/shims.ts`
- No `shims.d.ts`, `enums.d.ts` at root
- No `icon.png` (LeagueIR icon)
- No `DEVELOPMENT.md`
- No root `Makefile`
- No IR-specific test files

## Why

This sprint completes the template conversion project. The README is the
student's entry point — without it, the template is usable only by people
who already understand the project structure. The end-to-end validation
confirms that all prior sprints integrated correctly. The GitHub template
setting is the delivery mechanism that makes the repo accessible to students.

## Impact on Existing Components

- **README.md:** Replaces the existing IR-specific README entirely.
- **Deploy script:** No changes. Existing bridge integration is tested,
  not modified.
- **All other files:** No changes. This sprint is additive (README) and
  configurational (GitHub setting), plus validation of existing work.

## Migration Concerns

None. This sprint adds documentation and configuration. No data migration,
no API changes, no breaking changes. Students who have already cloned the
repo can `git pull` to get the README update.
