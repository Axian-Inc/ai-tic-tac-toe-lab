# FND-003: Scaffold application workspace

- Status: done
- Owner: application
- Branch: `application/product`
- Dependencies: FND-001
- Requirement source: `docs/agent-orchestration-plan.md`

## Acceptance criteria

- [x] Scaffold Vite React client, game-core package, .NET 10 solution, and contract locations.
- [x] Provide every stable root command, including non-deployment `npm run verify`.
- [x] Commit a reproducible root lockfile.
- [x] Build the client and server from a clean checkout.

## Implementation notes

The application agent owns the root lockfile. Coordinate public shapes through
FND-001.

## Automated/manual evidence

- The merged Phase 1 push run completed clean `npm ci`, the Vite/TypeScript
  builds, and the .NET 10 Release build successfully.

## Documentation impact

Provide real paths, prerequisites, and command semantics for README updates.

## Commit or PR

PR #20 established the scaffold; PR #23 repaired the initial integrated
lockfile. Both are merged into `zebanaya-kepler`.

## Risks/follow-ups

- Future workspace additions must regenerate, rather than text-merge, the root
  lockfile and prove it with `npm ci` on the CI platform.
