---
status: draft
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 006 Use Cases

## SUC-006-01: Student reads README and completes setup in under 5 minutes

Parent: (none — top-level sprint use case)

- **Actor**: Student with a GitHub account and a micro:bit V2
- **Preconditions**:
  - Student has created a repo from the template (or cloned it)
  - Student has access to GitHub Codespaces or a local environment with
    Node.js 22 installed
- **Main Flow**:
  1. Student opens the repository on GitHub and reads the README.
  2. Student clicks "Open in Codespaces" (or clones locally).
  3. In Codespaces, `postCreateCommand` runs `npm run setup` automatically.
     Locally, student runs `npm run setup` manually per README instructions.
  4. Student runs `npm run build` to verify the template compiles.
  5. Student sees a success message and the location of the `.hex` file.
  6. Student opens `src/robot.ts` and begins editing.
- **Postconditions**:
  - The project is fully set up (PXT installed, dependencies resolved)
  - A `.hex` file exists in `built/`
  - The student understands where to write code and how to get help
- **Acceptance Criteria**:
  - [ ] README contains clear prerequisites section
  - [ ] README contains quick start instructions (Codespaces and local)
  - [ ] README contains "Ask the AI Agent" section explaining Claude Code
  - [ ] Total time from opening README to successful build is under 5 minutes
    (excluding Codespace creation time)
  - [ ] README instructions are accurate — every command works as documented

## SUC-006-02: Student uses "Use this template" on GitHub to create their own repo

Parent: (none — top-level sprint use case)

- **Actor**: Student with a GitHub account
- **Preconditions**:
  - The repository has the "Template repository" setting enabled
  - Student is logged into GitHub
- **Main Flow**:
  1. Student navigates to the template repository on GitHub.
  2. Student clicks the green "Use this template" button.
  3. Student chooses "Create a new repository".
  4. Student names their repo (e.g., "my-robot") and clicks "Create".
  5. GitHub creates a new repository with the template's files but no
     shared commit history (no fork relationship).
  6. Student opens their new repo in Codespaces or clones it locally.
  7. Student runs `npm run setup && npm run build` successfully.
- **Postconditions**:
  - Student has their own repository with clean history
  - The repository is independent (no fork relationship)
  - All template files are present and the build works
- **Acceptance Criteria**:
  - [ ] "Template repository" checkbox is enabled in GitHub repo settings
  - [ ] "Use this template" button is visible on the repo page
  - [ ] New repo created from template has no fork relationship
  - [ ] New repo builds successfully after `npm run setup && npm run build`

## SUC-006-03: End-to-end test passes: fresh clone builds to .hex

Parent: (none — top-level sprint use case)

- **Actor**: Developer (instructor or CI system)
- **Preconditions**:
  - All prior sprints are complete (skills, cleanup, scripts, demo, devcontainer)
  - Node.js 22 is available
  - Docker is available (if C++ files are present)
- **Main Flow**:
  1. Clone the repository into a fresh directory.
  2. Run `npm run setup`.
  3. Verify setup completes without errors (PXT installed, target set,
     dependencies resolved).
  4. Run `npm run build`.
  5. Verify build completes without errors.
  6. Verify `built/` contains a `.hex` file.
  7. Verify the `.hex` file is non-empty (at least 1 KB).
- **Postconditions**:
  - A valid `.hex` file exists that could be flashed to a micro:bit V2
- **Acceptance Criteria**:
  - [ ] `npm run setup` exits with code 0
  - [ ] `npm run build` exits with code 0
  - [ ] `built/` directory contains at least one `.hex` file
  - [ ] The `.hex` file is larger than 1 KB
  - [ ] No warnings about missing files or misconfigured pxt.json

## SUC-006-04: Deploy script bridge path works end-to-end with .env configured

Parent: (none — top-level sprint use case)

- **Actor**: Developer (instructor testing bridge integration)
- **Preconditions**:
  - The project builds successfully (`npm run build` passes)
  - A `.env` file exists with `BRIDGE_URL` and `BRIDGE_KEY` set
  - A bridge endpoint is reachable (or a local mock is running)
- **Main Flow**:
  1. Create `.env` with `BRIDGE_URL=http://localhost:8081` and
     `BRIDGE_KEY=test-key`.
  2. Start a local mock server (or use the actual bridge) listening on
     the configured URL.
  3. Run `npm run deploy`.
  4. The deploy script builds the project first.
  5. The deploy script reads `.env`, finds both variables set.
  6. The deploy script POSTs the `.hex` file to `${BRIDGE_URL}/api/hex`
     with `Authorization: ${BRIDGE_KEY}` header.
  7. The script prints a message indicating bridge deploy was used.
  8. Remove `.env` (or unset the variables).
  9. Run `npm run deploy` again.
  10. The script falls back to `pxt deploy` and prints a message indicating
      local USB deploy was attempted.
- **Postconditions**:
  - Bridge path: the hex was POSTed to the correct URL with correct headers
  - Fallback path: `pxt deploy` was invoked
  - The script clearly communicates which deploy path was used
- **Acceptance Criteria**:
  - [ ] With `.env` set, deploy script POSTs hex to bridge URL
  - [ ] POST includes `Authorization` header with the bridge key
  - [ ] Without `.env`, deploy script falls back to `pxt deploy`
  - [ ] Script prints which deploy method was used in both cases
  - [ ] Script exits cleanly in both paths (no unhandled errors)
