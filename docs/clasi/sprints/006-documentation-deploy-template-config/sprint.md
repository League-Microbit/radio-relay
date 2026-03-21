---
id: "006"
title: "Documentation, Deploy & Template Config"
status: done
branch: sprint/006-documentation-deploy-template-config
use-cases:
  - SUC-006-01
  - SUC-006-02
  - SUC-006-03
  - SUC-006-04
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 006: Documentation, Deploy & Template Config

## Goals

This is the final sprint in the project. It delivers the student-facing
README.md, finalizes the deploy script's bridge integration with end-to-end
testing, enables the GitHub template repository setting, and validates the
entire template with a clean clone-to-hex test.

After this sprint, the repository is ready for students to use via GitHub's
"Use this template" button.

## Problem

The template repository has all its infrastructure in place (skills, config,
build scripts, demo program, Codespaces support) but lacks the student-facing
documentation that tells students what this is, how to get started, and how
to get help from the AI agent. The deploy script's bridge integration path
has not been tested end-to-end. The repository is not yet configured as a
GitHub template. No full clone-to-hex validation has been performed.

## Solution

1. Write a concise, student-focused README.md with setup instructions, quick
   start guide, an "Ask the AI Agent" section, instructions for adding
   extensions, and deployment instructions.
2. Test the deploy script's bridge integration path end-to-end with `.env`
   configured (BRIDGE_URL + BRIDGE_KEY set, verify POST behavior).
3. Enable the GitHub template repository setting via repository settings.
4. Run the full end-to-end validation: fresh clone, `npm run setup`,
   `npm run build`, verify `.hex` output exists and is non-empty.
5. Final cleanup pass: remove any leftover artifacts, verify `.gitignore`
   coverage, confirm pxt.json is correct.

## Success Criteria

- README.md exists and covers: what this is, quick start (under 5 minutes),
  "Ask the AI Agent" section, how to add extensions, how to deploy.
- A student can read the README and go from zero to a working build in under
  5 minutes (in Codespaces, the postCreateCommand handles setup automatically).
- The deploy script bridge path works end-to-end when `.env` is configured.
- The deploy script falls back to `pxt deploy` when `.env` is absent.
- The GitHub repository has the "Template repository" checkbox enabled.
- A fresh clone passes: `npm run setup && npm run build` produces a valid
  `.hex` file in `built/`.
- No leftover IR-specific files, no stale references, no broken paths.

## Scope

### In Scope

- **README.md** — Student-facing documentation with sections: project
  description, prerequisites, quick start, "Ask the AI Agent", adding
  extensions, deploying to micro:bit, project structure overview.
- **Deploy script bridge integration testing** — End-to-end test with
  `.env` configured; verify both bridge and fallback paths work.
- **GitHub template repository setting** — Enable the setting in repo
  configuration so "Use this template" button appears.
- **End-to-end validation** — Fresh clone -> `npm run setup` ->
  `npm run build` -> verify `.hex` output.
- **Final cleanup pass** — Remove any remaining artifacts from the
  conversion process, verify all files are accounted for.

### Out of Scope

- **Bridge server implementation** — The bridge is a separate project.
  We only test the client-side POST logic in the deploy script.
- **Automated CI/CD pipeline** — No GitHub Actions in this sprint.
- **Extension gallery publishing** — `"public": false` stays.
- **Skill content changes** — Skills were written in Sprint 001.
- **Build script changes** — Scripts were written in Sprint 003. Only
  the bridge integration path is tested here, not rewritten.

## Test Strategy

Testing in this sprint is primarily integration and end-to-end:

- **End-to-end build validation:** Fresh clone -> setup -> build -> verify
  hex output. This is the critical path that proves the template works.
- **Bridge integration test:** Configure `.env` with BRIDGE_URL and
  BRIDGE_KEY, run `npm run deploy`, verify the script attempts the POST
  (use a local test endpoint or mock). Then remove `.env` and verify
  fallback to `pxt deploy`.
- **README accuracy check:** Walk through every step in the README against
  the actual repo to confirm instructions match reality.
- **Template repo test:** Use "Use this template" on GitHub to create a
  new repo, clone it, verify clean history and working build.

## Architecture Notes

This sprint adds no new architectural components. It adds documentation
(README.md), validates existing components end-to-end, and configures a
GitHub setting. The deploy script bridge integration was designed in
Sprint 003; this sprint validates it works.

The README is deliberately thin — the AI agent (Claude Code) is the
primary source of help, not documentation. The README covers only what
a student needs to get started and points them to the agent for everything
else.

## GitHub Issues

(None linked.)

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [ ] Sprint planning documents are complete (sprint.md, use cases, architecture)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Dependencies

This sprint depends on all prior sprints being complete:

- **Sprint 001** — Agent skills and CLAUDE.md must exist
- **Sprint 002** — Template cleanup and config must be done (IR files removed,
  pxt.json/package.json/tsconfig.json in place)
- **Sprint 003** — npm scripts (setup.js, build.js, deploy.js) must work
- **Sprint 004** — Demo program (main.ts, robot.ts, test.ts) must compile
- **Sprint 005** — Codespaces devcontainer and Docker config must be in place

## Tickets

(To be created after sprint approval.)
