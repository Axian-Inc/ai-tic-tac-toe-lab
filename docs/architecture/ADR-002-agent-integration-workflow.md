# ADR-002: Agent branches integrate through zebanaya-kepler

- Status: accepted
- Date: 2026-08-26
- Owners: coordinator
- Related tickets: FND-001, FND-004

## Context

Concurrent agents need isolation, traceable ownership, predictable review, and
validation of the actual integrated commit.

## Decision

Every agent branch starts from current `zebanaya-kepler`, uses
`{agent-name}/{branch-name}`, and returns through a coordinator-reviewed pull
request. Agents use separate worktrees and do not self-merge. PRs into the
integration branch run validation; every push to it validates again before an
approved delivery may begin.

## Alternatives considered

- Branch directly from the starter: later work would miss accepted foundation
  changes.
- Merge directly to main: removes the explicit integration and phase gate.
- Trust PR results only: does not verify the resulting merge commit.

## Consequences

- Integration is auditable and each agent retains clear ownership.
- Agents must synchronize before handoff and resolve conflicts on their branch.
- Branch protection and the `axian-lnd` protected environment require
  repository-administrator configuration.
