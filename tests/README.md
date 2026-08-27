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
