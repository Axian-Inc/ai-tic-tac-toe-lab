# AI Workflow — Requirement Refinement

## Goal
Provide a repeatable process to turn coarse requirements into implementable stories with clear acceptance criteria and test plans.

## Prompt templates

### 1) Story enrichment prompt
```
You are refining a requirement into implementable stories.
Context:
- Project: Tic Tac Toe (React + TypeScript)
- Constraints: local-first UI, deterministic CPU, tests required.

Requirement:
<PASTE REQUIREMENT>

Output:
- 1–3 stories with titles
- Acceptance criteria (bulleted)
- Risks/unknowns
- Suggested tests (unit/E2E)
```

### 2) Decision + assumptions capture
```
Summarize decisions and assumptions:
- Decision list (what we chose)
- Assumptions list (what we assume to be true)
- Open questions
- Update targets (which docs to update)
```

### 3) Validation prompt
```
Given the refined stories:
- Propose a test plan
- Map each acceptance criterion to a test
- Identify missing coverage
```

## How to capture decisions + assumptions
- Add major decisions to `AGENTS.MD` “Current scope snapshot.”
- Update `docs/requirements-phase2.md` for scope changes.
- Update `docs/architecture.md` when data flow/structure changes.
- Note test-only behaviors in `docs/coding-standards.md`.

## Validation checklist
- Every acceptance criterion has a verification step.
- Tests are deterministic and runnable from CLI.
- No React imports in domain logic.
- E2E tests use stable selectors.

## Example

### Coarse requirement
"Add multiplayer with create/join and realtime updates."

### Refined stories
1. **Story: Create/join rooms**
   - User can create a room and receive a room ID.
   - User can join a room with a valid ID.
   - Invalid IDs show a clear error.

2. **Story: Realtime move sync**
   - Moves are sent over WebSockets.
   - Server validates turn order.
   - Clients stay in sync on reconnect.

### Test plan
- Unit: validate move rules server-side.
- Integration: simulate join + first move flow.
- E2E: open two clients, play a full game to completion.
