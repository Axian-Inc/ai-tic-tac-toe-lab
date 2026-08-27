# FND-003: Scaffold application workspace

- Status: in-progress
- Owner: application
- Branch: `application/product`
- Dependencies: FND-001
- Requirement source: `docs/agent-orchestration-plan.md`

## Acceptance criteria

- [ ] Scaffold Vite React client, game-core package, .NET 10 solution, and contract locations.
- [ ] Provide every stable root command, including non-deployment `npm run verify`.
- [ ] Commit a reproducible root lockfile.
- [ ] Build the client and server from a clean checkout.

## Implementation notes

The application agent owns the root lockfile. Coordinate public shapes through
FND-001.

## Automated/manual evidence

- Pending: `npm ci`, `npm run build`, and .NET build output.

## Documentation impact

Provide real paths, prerequisites, and command semantics for README updates.

## Commit or PR

Pending.

## Risks/follow-ups

- CI scaffolding cannot execute until root scripts exist.
