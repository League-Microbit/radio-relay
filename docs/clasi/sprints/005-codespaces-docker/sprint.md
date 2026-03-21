---
id: "005"
title: "Codespaces & Docker"
status: done
branch: sprint/005-codespaces-docker
use-cases:
  - SUC-005-01
  - SUC-005-02
  - SUC-005-03
  - SUC-005-04
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 005: Codespaces & Docker

## Goals

Configure the repository so that students can open it in GitHub Codespaces
and have a fully functional development environment without manual setup.
This includes the devcontainer configuration, VS Code editor settings
tailored to PXT projects, and generalization of the existing Docker
directory so it is no longer LeagueIR-specific.

## Problem

Students currently have no Codespaces support. Opening the repo in a
Codespace gives a bare environment with no Node.js version guarantee, no
Docker-in-Docker capability (needed for C++ cross-compilation), and no
automatic dependency installation. The existing `.vscode/settings.json`
is functional but does not hide PXT build artifacts from the file explorer,
which clutters the workspace. The `docker/README.md` still references
"leaguepulse/yotta" and "pext/yotta" naming from the LeagueIR project
and describes IR-specific integration details.

## Solution

1. Create `.devcontainer/devcontainer.json` with Node.js 22 base image,
   Docker-in-Docker feature, `postCreateCommand: npm run setup`, port 8081
   forwarding, and VS Code settings to hide build artifacts.
2. Update `.vscode/settings.json` to add `files.exclude` entries for
   `built/`, `pxt_modules/`, and `.pxt/` directories, and set
   `editor.tabSize` to 4.
3. Generalize `docker/README.md` to describe the image as a generic
   PXT/CODAL ARM cross-compilation image rather than a LeagueIR-specific
   artifact. Verify the Dockerfile itself is already generic (it is).
4. Verify end-to-end: Codespace creation should run `npm run setup`
   automatically and produce a working build environment.

## Success Criteria

- Opening the repo in a GitHub Codespace runs `npm run setup` automatically
  via `postCreateCommand` and completes without errors.
- The Codespace has Docker-in-Docker available so `scripts/setup.js` can
  build the `pxt/yotta` image when C++ files are present.
- VS Code file explorer hides `built/`, `pxt_modules/`, and `.pxt/`.
- Port 8081 is configured for bridge development but does not auto-prompt.
- `docker/README.md` contains no LeagueIR-specific references.
- The Dockerfile requires no changes (already generic).

## Scope

### In Scope

- `.devcontainer/devcontainer.json` -- new file
- `.vscode/settings.json` -- update existing file
- `docker/README.md` -- rewrite to be generic
- `docker/Dockerfile` -- verify generic, no changes expected
- `docker/Makefile` -- verify image name matches design (`pxt/yotta`),
  update if needed (currently uses `pext/yotta`)
- End-to-end Codespace creation test

### Out of Scope

- Pushing the Docker image to GitHub Container Registry (deferred per
  design doc until rebuild frequency is observed)
- Bridge server implementation (separate project)
- Changes to `scripts/setup.js` (Sprint 003 deliverable; this sprint
  depends on it being functional)
- Changes to `package.json` scripts (Sprint 003)
- Demo program or test files (Sprint 004)

## Test Strategy

**Integration testing:** Open the repository in a fresh GitHub Codespace
and verify:
1. `postCreateCommand` (`npm run setup`) runs and completes.
2. `node --version` reports v22.x.
3. `docker --version` succeeds (Docker-in-Docker is available).
4. `npm run build` succeeds (TypeScript-only build).
5. `built/`, `pxt_modules/`, `.pxt/` are hidden in VS Code file explorer.
6. Port 8081 appears in the ports panel but does not auto-open.

**Manual inspection:** Review `docker/README.md` for any remaining
LeagueIR-specific language. Verify `docker/Makefile` image name matches
the `pxt/yotta` convention from the design document.

## Architecture Notes

- The devcontainer uses Microsoft's official Node.js 22 base image
  (`mcr.microsoft.com/devcontainers/javascript-node:22`), not a custom
  Dockerfile. Docker-in-Docker is added as a devcontainer feature.
- `postCreateCommand` chains to `npm run setup`, which is the idempotent
  setup script from Sprint 003. This keeps the single-source-of-truth
  for environment setup in `scripts/setup.js`.
- The `docker/Makefile` currently tags the image as `pext/yotta:latest`.
  The design document specifies `pxt/yotta`. This needs to be updated
  so `scripts/setup.js` and the Makefile agree on the image name.

## GitHub Issues

(None linked.)

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [ ] Sprint planning documents are complete (sprint.md, use cases, architecture)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Dependencies

- **Sprint 003 (npm Scripts & Build Pipeline):** `npm run setup` must be
  implemented and working. The devcontainer's `postCreateCommand` calls it
  directly. If setup.js is not functional, Codespace creation will fail
  at the post-create step.
- **Sprint 002 (Template Cleanup & Configuration):** `package.json` must
  have the `setup` script defined.

## Tickets

(To be created after sprint approval.)
