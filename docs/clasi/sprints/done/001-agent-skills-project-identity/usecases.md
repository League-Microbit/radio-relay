---
status: draft
---
<!-- CLASI: Before changing code or making plans, review the SE process in CLAUDE.md -->

# Sprint 001 Use Cases

## SUC-001-01: Agent assists student with STS error

Parent: (project-level — no parent UC defined yet)

- **Actor**: Student using Claude Code agent
- **Preconditions**:
  - `.claude/skills/static-typescript/SKILL.md` is present in the project.
  - Student has written TypeScript code that uses a disallowed STS feature
    (e.g., `async/await`, `Map`, optional chaining `?.`).
  - The PXT build has failed with a cryptic error message.
- **Main Flow**:
  1. Student pastes the error message or describes the problem to the agent.
  2. Agent loads the `static-typescript` skill.
  3. Agent recognizes the error as an STS constraint violation by matching
     the error message or code pattern against the skill's known constraints.
  4. Agent explains why the feature is not available in Static TypeScript.
  5. Agent provides the correct STS-compatible workaround (e.g., use
     `control.inBackground()` instead of `async/await`, use an array
     instead of `Map`).
  6. Student applies the fix and the build succeeds.
- **Postconditions**:
  - Student understands the STS limitation.
  - Student's code compiles successfully.
- **Acceptance Criteria**:
  - [ ] The static-typescript skill documents all major disallowed features.
  - [ ] Each disallowed feature has a recommended workaround.
  - [ ] Common cryptic error messages are mapped to their STS causes.

## SUC-001-02: Agent guides student through block annotations

Parent: (project-level — no parent UC defined yet)

- **Actor**: Student using Claude Code agent
- **Preconditions**:
  - `.claude/skills/pxt/SKILL.md` and `references/block-annotations.md`
    are present in the project.
  - Student has written a TypeScript function and wants it to appear as
    a draggable block in the MakeCode visual editor.
- **Main Flow**:
  1. Student asks the agent how to make their function show up as a block.
  2. Agent loads the `pxt` skill and the block-annotations reference.
  3. Agent explains the `//% block="..."` annotation syntax.
  4. Agent provides a concrete example using the student's function,
     including appropriate `blockId`, parameter labels, and namespace
     color/icon if needed.
  5. Agent reminds the student that the function must be an `export function`
     inside a namespace and the file must be in pxt.json `files` (not
     `testFiles`).
  6. Student adds the annotations and sees the block in the MakeCode editor.
- **Postconditions**:
  - Student's function appears as a block in MakeCode.
  - The block has a meaningful label and correct parameter inputs.
- **Acceptance Criteria**:
  - [ ] The pxt skill covers namespace conventions for blocks.
  - [ ] The block-annotations reference documents `block`, `blockId`,
        `weight`, `group`, `color`, `icon`, and parameter annotations.
  - [ ] At least one worked example shows end-to-end block creation.

## SUC-001-03: Agent follows CLAUDE.md guardrails when helping

Parent: (project-level — no parent UC defined yet)

- **Actor**: Student using Claude Code agent (or the agent acting autonomously)
- **Preconditions**:
  - `CLAUDE.md` is present at project root with all six sections.
  - Student asks the agent for help with a task that could lead to a
    common mistake (e.g., "install lodash", "use ES modules", "create a
    new .ts file").
- **Main Flow**:
  1. Student asks the agent to do something that would violate a guardrail
     (e.g., "npm install lodash" or "create src/utils.ts").
  2. Agent loads CLAUDE.md and checks the "what not to do" section and
     pxt.json rules.
  3. For the npm install case: Agent explains that npm packages cannot be
     used in MakeCode projects — only PXT extensions added via pxt.json
     `dependencies`.
  4. For the new file case: Agent creates the file AND adds it to
     pxt.json `files` array in the same operation, preventing the silent
     "file is ignored" failure.
  5. Agent uses the correct build command (`npm run build`) rather than
     improvising a raw `pxt build` invocation.
- **Postconditions**:
  - The student is not led down a dead-end path.
  - Any new files are properly registered in pxt.json.
  - Build commands match the project's conventions.
- **Acceptance Criteria**:
  - [ ] CLAUDE.md contains a "what not to do" section with at least 5
        guardrails.
  - [ ] CLAUDE.md documents the pxt.json sync rule (every new file must
        be added to files or testFiles).
  - [ ] CLAUDE.md lists all npm run commands with descriptions.
  - [ ] CLAUDE.md contains skill pointers so the agent knows where to
        find deeper information.
