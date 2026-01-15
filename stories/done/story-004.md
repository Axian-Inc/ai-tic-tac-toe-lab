# Story 004

## Title
- Integrate Bedrock AI move service with prompt profiles

## Context
- The AI opponent is a key differentiator for the POC and must return legal moves.

## Problem Statement
- Without a reliable AI service, the game cannot progress after the player move.

## Inputs
- AI prompt input includes `GameState`, rules summary, and opponent profile instructions.

## Outputs
- AI JSON output: `{moveIndex: number, rationale: string}` with `moveIndex` in `[0..8]`.

## Acceptance Criteria
- [x] Prompt enforces strict JSON output matching `{moveIndex: number, rationale: string}` with no extra keys.
- [x] Backend validates AI output and retries up to 2 times on invalid output (total 3 attempts).
- [x] Timeouts are enforced per call (<= 10 seconds) and return an `ErrorResponse` on failure.
- [x] At least three opponent profiles exist (prompt variants or model configs).

## Plan
- [x] Add Bedrock-backed AI move service with strict JSON parsing and retries.
- [x] Define opponent profiles and prompt styles.
- [x] Add deterministic must-do scenario coverage per profile.

## Definition of Done
- [x] Bedrock integration uses configured region/model from env.
- [x] Deterministic AI behavior tests include at least 3 must-do scenarios per profile with explicit board inputs and expected `moveIndex`.
- [x] AI response is never logged in full (only redacted summaries).

## Dependencies
- Story 011 (schemas), Story 002 (rules), Story 003 (API).

## Notes
- Start with a single model and vary prompt instructions per profile.
- Tests added: `npm test -- src/backend/__tests__/aiMoveService.test.ts`.

## Done
- Bedrock-backed AI move service implemented with retries, timeouts, and prompt profiles.
