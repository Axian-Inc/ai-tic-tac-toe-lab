# ADR-004: Deterministic CPU and generated feedback assets

- Status: proposed
- Date: 2026-08-26
- Owners: coordinator and application
- Related tickets: PH1-001, PH1-002

## Context

Phase 1 requires a CPU that repeats the same choice for the same board, a
Playwright journey in which the player wins, and distinct move/win/loss sounds.
Randomness or an unbeatable strategy would make acceptance brittle or
impossible. Imported media introduces licensing and attribution work.

## Proposed decision

Use a documented priority-based CPU with a stable tie-break order and enough
imperfection to permit a known player win. Implement simple sound feedback with
the Web Audio API and visual celebration in code, avoiding committed third-party
media where practical. Provide reduced-motion and muted/unsupported-audio
fallbacks. Exact CPU priorities and UX language await coordinator approval.

## Alternatives considered

- Optimal minimax: deterministic but prevents the required player-win path.
- Random legal moves: beatable but not deterministic without exposed seeding.
- Downloaded sound/confetti files: fast, but adds license, provenance, and
  asset-loading concerns.

## Consequences

- Acceptance fixtures can use a stable move sequence.
- CPU behavior becomes a public gameplay rule that must be documented and
  covered with golden vectors.
- Browser audio policies require tests to assert state/feedback beyond sound.
