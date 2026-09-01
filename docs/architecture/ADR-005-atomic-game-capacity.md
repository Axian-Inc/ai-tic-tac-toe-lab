# ADR-005: Atomically enforce active-game capacity

- Status: accepted
- Date: 2026-08-26
- Owners: coordinator and application
- Related tickets: PH2-001, PH2-003, PH2-004

## Context

The service must admit at most 25 concurrent multiplayer games and return HTTP
429 beyond capacity. Counting active rows before creating a game races when
requests arrive together.

## Decision

Waiting and active games both consume one of 25 slots. Use a DynamoDB
transaction that conditionally increments a singleton capacity item below 25
while creating the aggregate, sequence-1 event, and accepted-command receipt.
Every transition to `over` conditionally changes `capacityHeld` from true to
false and decrements the counter in the same transaction. Count-then-create is
forbidden. A capacity rejection returns HTTP 429 and stores no command receipt.

A waiting creator may cancel and release its slot. Phase 2 does not
automatically expire waiting games, so operations must provide an explicit
reconciliation path for abandoned waiting games or slot disagreement.

## Alternatives considered

- Query/count before create: does not enforce the limit atomically.
- Reserved concurrency: limits Lambda execution, not active domain objects.
- Add a relational database: provides transactions but adds disproportionate
  cost and operations for this workload.

## Consequences

- Simultaneous creation needs targeted concurrency tests.
- Every terminal or cancellation transition must share one idempotent release
  behavior.
- Operators need metrics and repair guidance for slot/game disagreement.
