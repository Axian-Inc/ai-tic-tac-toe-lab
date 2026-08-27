# FND-001: Define shared contracts and terminology

- Status: in-progress
- Owner: coordinator
- Branch: `coordinator/contracts`
- Dependencies: none
- Requirement source: `docs/agent-orchestration-plan.md`

## Acceptance criteria

- [ ] Define game status, player marks, result vocabulary, and board coordinates.
- [ ] Approve HTTP operations, WebSocket envelope/versioning, and error semantics.
- [ ] Approve root commands and golden rule-vector format.

## Implementation notes

Documentation may propose designs, but only the coordinator freezes public
contracts.

## Automated/manual evidence

- Pending: contract review and validation results.

## Documentation impact

Update contract references and relevant ADR statuses.

## Commit or PR

Pending.

## Risks/follow-ups

- Dependent agents must not invent incompatible schemas.
