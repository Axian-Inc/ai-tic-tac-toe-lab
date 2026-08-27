# PH3-001: Add real-time spectating

- Status: planned
- Owner: application
- Branch: `application/phase-3-spectator`
- Dependencies: PH2-001, PH2-002
- Requirement source: `docs/requirements/phase-3.md`

## Acceptance criteria

- [ ] List active games and open a read-only spectator view.
- [ ] Catch up current ordered state before applying future events.
- [ ] Prevent spectators from issuing player commands.

## Implementation notes

Use coordinator-approved vocabulary and event contracts.

## Automated/manual evidence

- Pending: component and integration results.

## Documentation impact

Spectator journey, authorization boundary, and reconnect behavior.

## Commit or PR

Pending.

## Risks/follow-ups

- A race between catch-up and subscription can omit an event if sequencing is incomplete.
