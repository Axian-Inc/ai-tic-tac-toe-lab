# PH2-002: Add multiplayer client flows

- Status: planned
- Owner: application
- Branch: `application/phase-2-client`
- Dependencies: PH2-001
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [ ] Create and join waiting games.
- [ ] Apply authoritative WebSocket updates asynchronously.
- [ ] Reconnect and catch up without duplicating moves.
- [ ] Resign and display shared terminal results.
- [ ] Preserve all Phase 1 behavior.

## Implementation notes

The client suggests commands; it never declares authoritative multiplayer
state.

## Automated/manual evidence

- Pending: component and multiplayer Playwright results.

## Documentation impact

Multiplayer user journey, recovery, and error feedback.

## Commit or PR

Pending.

## Risks/follow-ups

- Duplicate and out-of-order WebSocket messages require reconciliation.
