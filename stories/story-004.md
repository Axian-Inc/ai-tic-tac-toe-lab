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
- [ ] Prompt enforces strict JSON output matching `{moveIndex: number, rationale: string}` with no extra keys.
- [ ] Backend validates AI output and retries up to 2 times on invalid output (total 3 attempts).
- [ ] Timeouts are enforced per call (<= 10 seconds) and return an `ErrorResponse` on failure.
- [ ] At least three opponent profiles exist (prompt variants or model configs).

## Definition of Done
- [ ] Bedrock integration uses configured region/model from env.
- [ ] Deterministic AI behavior tests include at least 3 must-do scenarios per profile with explicit board inputs and expected `moveIndex`.
- [ ] AI response is never logged in full (only redacted summaries).

## Dependencies
- Story 011 (schemas), Story 002 (rules), Story 003 (API).

## Notes
- Start with a single model and vary prompt instructions per profile.
