# ADR-005: Atomically enforce active-game capacity

- Status: proposed
- Date: 2026-08-26
- Owners: coordinator and application
- Related tickets: PH2-001, PH2-003, PH2-004

## Context

The service must admit at most 25 concurrent multiplayer games and return HTTP
429 beyond capacity. Counting active rows before creating a game races when
requests arrive together.

## Proposed decision

Use a DynamoDB transaction that conditionally acquires one capacity slot while
creating a game. Release the slot idempotently on every transition out of the
active-capacity set. Reconcile leaked slots with a documented operational path.
The definition of which statuses consume capacity, key layout, and transaction
shape remain pending coordinator approval.

## Alternatives considered

- Query/count before create: does not enforce the limit atomically.
- Reserved concurrency: limits Lambda execution, not active domain objects.
- Add a relational database: provides transactions but adds disproportionate
  cost and operations for this workload.

## Consequences

- Simultaneous creation needs targeted concurrency tests.
- Every terminal transition must share one idempotent release behavior.
- Operators need metrics and repair guidance for slot/game disagreement.
