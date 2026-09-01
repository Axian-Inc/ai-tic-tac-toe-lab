# PH2-002: Add multiplayer client flows

- Status: review
- Owner: application
- Branch: `client/phase-2-multiplayer`
- Dependencies: PH2-001
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [x] Create and join waiting games.
- [x] Apply authoritative WebSocket updates asynchronously.
- [x] Reconnect and catch up without duplicating moves.
- [x] Resign and display shared terminal results.
- [x] Preserve all Phase 1 behavior.

## Implementation notes

The client suggests commands; it never declares authoritative multiplayer
state.

## Automated/manual evidence

- Web workspace TypeScript lint passes.
- Focused API and sequence-reconciliation Vitest coverage is included.
- Full Vitest and Vite execution is pending unrestricted Linux CI because the
  local managed Windows sandbox rejects the esbuild child process with
  `spawn EPERM` before test discovery.

## Documentation impact

`apps/web/README.md` documents the multiplayer user journey, in-memory seat
capabilities, reconnect/replay behavior, and the exact deployment variables.

## Commit or PR

Pending.

## Risks/follow-ups

- CI must confirm the production bundle and focused Vitest cases.
- End-to-end multiplayer acceptance remains owned by PH2-003.
