# Quality and Acceptance

This directory contains the independent acceptance strategy for the three
project phases. It deliberately describes externally observable behavior and
does not define HTTP payloads, WebSocket envelopes, or board coordinates; the
coordinator owns those contracts.

- [`quality-plan.md`](quality-plan.md) defines test layers, required scenarios,
  reliability rules, coverage expectations, and evidence handling.
- [`acceptance-matrix.md`](acceptance-matrix.md) maps every supplied requirement
  and acceptance criterion to planned evidence.
- [`contract-questions.md`](contract-questions.md) lists decisions required
  before executable contract and end-to-end tests can be finalized.

## Naming convention

Executable tests use `<phase>-<area>-<sequence>: <observable behavior>` as the
test title, for example:

```text
P1-GAME-001: records legal moves in play order
P2-CAP-001: rejects exactly the 26th concurrent active-game creation
P3-SPEC-002: catches a late spectator up before delivering live moves
```

Test IDs are stable. Refactors may change filenames but must not silently
rename an ID used by the acceptance matrix or ticket evidence.

## Evidence convention

CI publishes evidence under a run-specific artifact named
`quality-evidence-<git-sha>-<run-attempt>`. Inside the artifact:

```text
evidence/
  manifest.json
  unit/{typescript,dotnet}/
  integration/
  playwright/{html-report,test-results}/
  coverage/{web,game-core,api}/
  build/
  infra/
```

`manifest.json` records the commit SHA, branch, UTC run time, command, test ID,
result, duration, and artifact-relative paths. Screenshots, videos, traces,
coverage output, and reports are generated artifacts and must not be committed.
Manual evidence uses the same acceptance ID and records verifier, UTC time,
environment, result, and a link or artifact path. A missing artifact or flaky
retry is not a passing result.

## Phase 2 harness boundaries

Phase 2 scenario code depends on the test-owned `MultiplayerApiAdapter`,
`GameEventStreamAdapter`, controlled clock, and capacity harness interfaces.
Wire paths and payloads are confined to adapter implementations. Server tests
bind these interfaces to the ASP.NET test host and real atomic persistence
adapter; browser tests bind them to Playwright request and isolated browser
contexts.

Foundation tests named `P2-HARNESS-*` prove the harness itself, not product
acceptance. Product IDs such as `P2-CAP-001` pass only when they execute the
application's real transaction path. Pending server/client seams are reported
as handoff requirements and must not be replaced with quality-owned product
implementations or mocked evidence.

The published client seam is configured with `VITE_API_BASE_URL` and
`VITE_WS_URL`, exposes its wire adapters under `apps/web/src/multiplayer`, and
renders the last contiguous server sequence at
`data-testid="multiplayer-sequence"`. Browser helpers fail fast when either URL
is absent or uses the wrong protocol. The Phase 2 E2E run must start the real
API/WebSocket host first and pass both variables to the Vite/Playwright
process.

The published server seam uses `WebApplicationFactory<Program>` for HTTP
integration, injected `TimeProvider` for the exact abandonment boundary,
`IGameStore` for atomic game/event/receipt/capacity commits, and
`IGameBroadcaster` for WebSocket publication. Quality scenarios bind to these
interfaces after PH2-001 is integrated; an in-test count-then-create fake is
not valid capacity evidence.
