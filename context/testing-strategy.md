# Testing Strategy

## Goals
- Protect core game rules, API contracts, and AI-move validation.
- Keep tests fast and deterministic for a POC demo cadence.
- Separate deterministic validation from non-deterministic LLM behavior.

## Test-First Workflow
- Start from stories/acceptance criteria and write the smallest failing test.
- Use deterministic fixtures (board states, move histories, opponent IDs).
- Implement logic to pass tests, then refactor while keeping tests green.
- Add AI behavior tests only when they can be deterministic or rule-based.

## Test Categories
### Unit
- Game engine: move validation, win/draw detection, state transitions.
- Schema validation: zod schemas for requests/responses and AI output.
- Prompt builders and response parsers (with fixed fixtures).

### Integration
- API handlers: `/v1/new-game` and `/v1/move` with full request validation.
- Backend wiring: game engine + AI adapter (LLM calls stubbed).
- Error shaping and retries (invalid AI response, timeout, terminal state).

### AI Behavior (Deterministic Subset)
- Legal move selection (no occupied cell, no moves after terminal state).
- Must-do scenarios per opponent profile (forced win/block cases).
- Output schema adherence and parsing (JSON shape, move index).

## What Not To Test Automatically
- LLM creativity or stylistic rationale quality.
- Subjective UI aesthetics, layout, or copy tone.
- Real Bedrock latency/availability or model nondeterminism (manual smoke only).
- Full end-to-end playthroughs against live Bedrock in CI.

## Backend Testing Notes
- Use `vitest` for unit and integration tests.
- Mock Bedrock client and inject deterministic responses for AI adapter tests.
- Contract tests for request/response shapes and error payloads.
- Validate stateless consistency: move counts, winner status, terminal state.

## Frontend Testing Notes
- Use `@testing-library/react` with `vitest` for component and UI state tests.
- Test move input handling, board rendering, and error display.
- Mock API client responses (success, invalid move, AI failure).
- Keep UI tests focused on behavior, not visual snapshots.

## Optional Manual Tests (POC)
- Live Bedrock smoke test: single game with each opponent profile.
- Cross-browser smoke (Chrome, Firefox) for the web UI.
