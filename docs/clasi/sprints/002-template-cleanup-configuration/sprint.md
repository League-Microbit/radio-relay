---
id: "002"
title: "Template Cleanup & Configuration"
status: done
branch: sprint/002-template-cleanup-configuration
use-cases:
  - SUC-002-01
  - SUC-002-02
  - SUC-002-03
  - SUC-002-04
  - SUC-002-05
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 002: Template Cleanup & Configuration

## Goals

Transform the repository from a LeagueIR NEC infrared extension into a
clean, generic micro:bit student robotics template by:

1. Deleting all LeagueIR-specific source files, tests, assets, and docs.
2. Writing new configuration files (`pxt.json`, `package.json`,
   `tsconfig.json`, `.gitignore`, `.env.example`) that define the generic
   template identity.

After this sprint the repo compiles as an empty "my-robot" project with
no IR code, no IR references, and correct PXT configuration.

## Problem

The repository currently contains a fully functional LeagueIR extension.
Every source file, test file, configuration entry, and documentation page
is IR-specific. Students cannot use the repo as a starting point without
manually identifying and removing IR artifacts, then reconfiguring
`pxt.json` and `package.json` from scratch. This is error-prone and
wastes class time.

## Solution

1. **Delete 13 IR-specific files** — source, tests, generated type
   declarations, icon, docs, and root Makefile.
2. **Rewrite `pxt.json`** — rename to `"my-robot"`, set `"public": false`,
   list `src/robot.ts` in `files` and `src/main.ts` + `test/test.ts` in
   `testFiles`, declare only `core` dependency.
3. **Rewrite `package.json`** — single runtime dependency (`pxt-microbit`),
   npm script stubs (`setup`, `build`, `deploy`, `test`, `serve`, `clean`)
   that will be wired to real scripts in Sprint 003.
4. **Write `tsconfig.json`** — PXT-compatible compiler options.
5. **Write `.gitignore`** — cover `built/`, `pxt_modules/`,
   `node_modules/`, `.pxt/`, `*.hex`, `*.d.ts`, `.env`, `.DS_Store`.
6. **Write `.env.example`** — `BRIDGE_URL` and `BRIDGE_KEY` commented out.

## Success Criteria

- No file in the repository references "LeagueIR", "NEC", "infrared",
  or "IR" (except historical planning docs under `docs/`).
- `pxt.json` parses as valid JSON and matches the spec in
  `MbTemplateDesignV2.md`.
- `.gitignore` covers all PXT-generated artifacts.
- `.env.example` contains bridge variable placeholders.
- The repository structure matches the "after" state described in the
  design doc (minus files created in later sprints like `scripts/`,
  `.devcontainer/`, demo source files).

## Scope

### In Scope

**Files to delete:**

| File | Reason |
|---|---|
| `src/ir.ts` | IR-specific source |
| `src/ir.cpp` | IR-specific C++ source |
| `src/irpacket.ts` | IR-specific source |
| `src/lib.ts` | IR-specific helper |
| `src/shims.ts` | IR simulator shims |
| `shims.d.ts` | Auto-generated for IR C++ |
| `enums.d.ts` | Auto-generated for IR C++ |
| `icon.png` | LeagueIR icon |
| `test/testNec.ts` | IR-specific test |
| `test/testIRPacket.ts` | IR-specific test |
| `test/testPulse.ts` | IR-specific test |
| `DEVELOPMENT.md` | IR-specific dev notes |
| `Makefile` (root) | Replaced by npm scripts |

**Files to create or rewrite:**

| File | Description |
|---|---|
| `pxt.json` | Generic template config: name `"my-robot"`, `public: false`, `files: ["README.md", "src/robot.ts"]`, `testFiles: ["src/main.ts", "test/test.ts"]` |
| `package.json` | `pxt-microbit` as sole dependency, npm script stubs |
| `tsconfig.json` | PXT-compatible TypeScript compiler options |
| `.gitignore` | Covers `built/`, `pxt_modules/`, `node_modules/`, `.pxt/`, `*.hex`, `*.d.ts`, `.env`, `.DS_Store` |
| `.env.example` | `BRIDGE_URL` and `BRIDGE_KEY` commented out |

### Out of Scope

- Source code for `src/main.ts`, `src/robot.ts`, `test/test.ts` (Sprint 004).
- Build scripts in `scripts/` (Sprint 003).
- `.devcontainer/`, `.vscode/` configuration (Sprint 005).
- `README.md` content rewrite (Sprint 006).
- Actual npm script implementations — this sprint writes stubs only.

## Test Strategy

This sprint is primarily a file-deletion and configuration-writing sprint.
Testing is verification-based:

1. **File presence check** — confirm all 13 IR files are gone and all 5
   config files exist.
2. **JSON validation** — confirm `pxt.json`, `package.json`, and
   `tsconfig.json` parse as valid JSON.
3. **Content grep** — confirm no remaining file references "leagueir",
   "NEC", or IR-specific identifiers (excluding `docs/` planning history).
4. **gitignore coverage** — confirm `.gitignore` lists all PXT-generated
   artifact patterns.

No build test is possible yet because `src/robot.ts` and `src/main.ts`
do not exist until Sprint 004. The configuration files are written to be
correct per the design spec; build validation happens in Sprint 003+.

## Architecture Notes

- This sprint has a soft dependency on Sprint 001 (CLAUDE.md and skills
  must exist). Sprint 001 is complete.
- The `docker/` directory is intentionally left untouched in this sprint.
  It will be generalized in Sprint 005.
- `README.md` is listed in `pxt.json` `files` per the design spec. Its
  content is rewritten in Sprint 006, but the file must exist for
  `pxt.json` to be valid.
- npm script stubs in `package.json` use placeholder commands (e.g.,
  `"echo 'not yet implemented'"`) that will be replaced in Sprint 003
  when the real `scripts/` directory is created.

## GitHub Issues

(None linked yet.)

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [ ] Sprint planning documents are complete (sprint.md, use cases, architecture)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Tickets

(To be created after sprint approval.)
