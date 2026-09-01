# PH2-003: Prove multiplayer behavior

- Status: review
- Owner: quality
- Branch: `quality/phase-2-multiplayer`
- Dependencies: PH2-001, PH2-002
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [ ] Test commands, wins, resignation, abandonment, idempotency, and replay.
- [ ] Prove concurrent capacity and the 26th-game HTTP 429.
- [ ] Run a complete two-browser multiplayer Playwright game.
- [ ] Run Phase 1 regression and Phase 2 checks together.

## Implementation notes

Use a controlled server clock for abandonment tests.

## Automated/manual evidence

- PASS: `npm run lint --workspace @tic-tac-toe/quality-unit` validates the
  quality-owned TypeScript suite.
- BLOCKED LOCALLY: `npm run test:unit --workspace
  @tic-tac-toe/quality-unit` reached Vitest startup, but the managed Windows
  sandbox denied Vite/esbuild's child-process spawn with `EPERM`. TypeScript
  compilation passed; CI or an approved unsandboxed run must record the test
  result before review approval.
- Client binding: `P2-SEAM-CLIENT-001..002` targets
  `VITE_API_BASE_URL`, `VITE_WS_URL`, `data-testid="multiplayer-sequence"`,
  and the adapters under `apps/web/src/multiplayer`. These checks are
  dependency-gated until PH2-002 is integrated, so a skip is not acceptance
  evidence.
- Reviewed server bindings: PH2-001 exposes `WebApplicationFactory<Program>`,
  injected `TimeProvider`, an atomic `IGameStore` transaction seam, and an
  `IGameBroadcaster` WebSocket publishing seam. Its application-owned tests
  cover create/join/win, exact idempotent retry, abandonment at 180 seconds,
  scoped capabilities, and concurrent capacity.
- Pending: run the server suite and dependency-gated client seam checks after
  PH2-001/PH2-002 integration; then add and run the complete two-browser
  Playwright journey against live HTTP/WebSocket endpoints.

## Documentation impact

Testing matrix and known timing/concurrency diagnostics.

## Commit or PR

Branch `quality/phase-2-multiplayer`; commit and PR assigned during coordinator
handoff.

## Risks/follow-ups

- Local emulators may not perfectly model DynamoDB transaction behavior.
- PH2-003 must not be marked done until its server, client, and two-browser
  checks run together on the integration result. Foundation checks alone do
  not satisfy the acceptance criteria.
