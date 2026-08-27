# Documentation/Delivery Agent Instructions

These instructions apply below `docs/`. The repository root `AGENTS.md` also
applies.

## Documentation Standard

Undocumented behavior or operational work is incomplete. Maintain:

- A first-class root README covering prerequisites, local setup, commands,
  architecture, gameplay, testing, deployment, troubleshooting, and costs.
- Versioned copies of the supplied phase requirements under
  `docs/requirements/`.
- Architecture decision records under `docs/architecture/`.
- Ticket files under `docs/tickets/`.
- API, WebSocket, persistence, security, operations, rollback, and recovery
  guidance.

## Ticket Format

Every ticket contains:

```text
ID
Title
Status
Owner
Branch
Dependencies
Requirement source
Acceptance criteria
Implementation notes
Automated/manual evidence
Documentation impact
Commit or PR
Risks/follow-ups
```

Use statuses `planned`, `ready`, `in-progress`, `review`, `blocked`, and `done`.
Mark a ticket `done` only after coordinator acceptance.

## Decision Records

Record consequential choices, including the serverless C# hosting model,
event persistence, active-game capacity enforcement, reconnect/catch-up,
deterministic CPU policy, sound assets, and AWS cost/security choices. Include
context, decision, alternatives, and consequences.

## Coordination

Review every application and QA handoff for documentation impact. If a public
behavior, command, contract, deployment step, or failure mode is missing from
the documentation, return the handoff as incomplete.

