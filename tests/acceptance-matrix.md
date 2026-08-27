# Acceptance Traceability Matrix

Status for all rows is **Planned** until linked evidence is produced. `A`
means automated, `M` means manual/review evidence, and `A+M` requires both.
Test-family IDs refer to the naming scheme in [`README.md`](README.md).

## Phase 1

| ID | Requirement or acceptance criterion | Evidence | Mode |
| --- | --- | --- | --- |
| P1-001 | Local-only Tic-Tac-Toe is a React TypeScript application | Build/typecheck plus `P1-E2E-001` | A |
| P1-002 | Game module tracks complete game state | `P1-GAME-001..` state-transition suite | A |
| P1-003 | Game module preserves move order and placement | `P1-GAME-HISTORY-001..` | A |
| P1-004 | Game module identifies the current turn | `P1-GAME-TURN-001..` | A |
| P1-005 | Game module detects wins and draws | `P1-GAME-RESULT-001..` including all eight win lines | A |
| P1-006 | Key game behaviors have tests | Domain report mapped to P1-002..005 | A |
| P1-007 | Landing page greets the user and starts CPU play | `P1-UI-LANDING-001`, `P1-E2E-001` | A |
| P1-008 | Game detail shows turn, game-over state, and winner | `P1-UI-STATUS-001..`, `P1-E2E-001..002` | A |
| P1-009 | Human win triggers confetti and winning sound | `P1-UI-FEEDBACK-001`, `P1-E2E-001` | A |
| P1-010 | Human loss triggers losing sound and visual/written try-again feedback | `P1-UI-FEEDBACK-002`, `P1-E2E-002` | A |
| P1-011 | Each accepted placement produces a pleasant thud sound | `P1-UI-AUDIO-001` plus UX review | A+M |
| P1-012 | UI prevents illegal moves | `P1-UI-LEGALITY-001..`, `P1-E2E-003` | A |
| P1-013 | Pointer/focus feedback distinguishes valid and invalid moves | `P1-UI-AFFORDANCE-001..` plus UX review | A+M |
| P1-014 | A game can be quit | `P1-UI-QUIT-001`, `P1-E2E-003` | A |
| P1-015 | Finished CPU game offers rematch | `P1-UI-REMATCH-001`, `P1-E2E-001` | A |
| P1-016 | CPU choice is deterministic for the same board | `P1-CPU-001..` and golden full-game sequences | A |
| P1-017 | Project and implemented approaches are fully documented | Documentation checklist/review linked to tickets | M |
| P1-018 | IaC deploys the client to the Axian AWS LnD account | Synth test plus named-account deployment/smoke evidence | A+M |
| P1-019 | Playwright plays a full game and verifies a winning condition | `P1-E2E-001` report and trace on failure | A |
| P1-020 | Playwright and unit tests run from command line and are CI-automatable | Clean invocation of `npm run test:unit` and `npm run test:e2e` | A |
| P1-021 | README explains setup, architecture, behavior, tests, and deployment | Documentation checklist/review | M |
| P1-022 | Codex CLI getting-started documentation has been completed | Coordinator-approved completion artifact | M |

## Phase 2

| ID | Requirement or acceptance criterion | Evidence | Mode |
| --- | --- | --- | --- |
| P2-001 | HTTP server brokers multiplayer games | API integration suite `P2-API-001..` | A |
| P2-002 | Server validates commands, updates state, and broadcasts events | `P2-CMD-001..`, `P2-WS-001..` | A |
| P2-003 | Players and multiple third parties can observe a game | WS integration plus Phase 3 spectator contexts | A |
| P2-004 | Create/list/join/move/resign/spectate-or-subscribe/abandonment endpoints follow the frozen contract | OpenAPI/event contract suite | A |
| P2-005 | Three-minute inactive game becomes over and winner is broadcast | Controlled-clock `P2-ABANDON-001..` | A |
| P2-006 | Either client can request an abandonment decision | `P2-ABANDON-CLIENT-001..` | A |
| P2-007 | Remote moves arrive over WebSocket | `P2-WS-MOVE-001`, `P2-E2E-001` | A |
| P2-008 | Client suggests a game-specific move and server authoritatively validates it | `P2-CMD-MOVE-001..` | A |
| P2-009 | At most 25 concurrent multiplayer games exist and the 26th gets HTTP 429 | Atomic `P2-CAP-001` | A |
| P2-010 | Stored ordered data can replay old games and catch clients up live | `P2-HISTORY-001..`, `P2-RECONNECT-001..` | A |
| P2-011 | Server tests cover key behavior including creation limit and abandonment | Server test report mapped to P2-005/009 | A |
| P2-012 | Player resignation ends game and awards opponent | `P2-RESIGN-001..` plus browser journey | A |
| P2-013 | System has no user authentication | Contract/config review and unauthenticated E2E setup | A+M |
| P2-014 | IaC includes a low-cost backend footprint | Synth/assertion tests plus architecture/cost review | A+M |
| P2-015 | Client can create a waiting multiplayer game | `P2-UI-CREATE-001`, `P2-E2E-001` | A |
| P2-016 | Client can list and join a waiting game; later players cannot join | `P2-UI-JOIN-001..`, `P2-E2E-001` | A |
| P2-017 | Single-player behavior from Phase 1 remains working | Complete Phase 1 regression suite | A |
| P2-018 | Game state and ordered move history are preserved | Persistence restart/replay `P2-HISTORY-001..` | A |
| P2-019 | Two players can create, join, play, and see complementary win/loss results | Two-context `P2-E2E-001` | A |
| P2-020 | Multiplayer updates are asynchronous and require no reload/polling action | WS assertions in `P2-E2E-001` | A |
| P2-021 | Concurrent create and move behavior is covered | API integration/concurrency report | A |
| P2-022 | IaC is updated for the complete Phase 2 resource footprint | Synth assertions and deployment evidence | A+M |

## Phase 3

| ID | Requirement or acceptance criterion | Evidence | Mode |
| --- | --- | --- | --- |
| P3-001 | UI lists active games and offers a Spectate action | `P3-UI-LIST-001`, `P3-E2E-001` | A |
| P3-002 | Spectator receives current state and future real-time updates | Three-context `P3-E2E-001..002` | A |
| P3-003 | Server exposes games in progress | `P3-API-ACTIVE-001..` contract/integration tests | A |
| P3-004 | Spectators are read-only and multiple spectators do not take player seats | `P3-SPEC-AUTH-001..`, multi-context integration | A |
| P3-005 | Coverage report is generated from the terminal | Clean `npm run coverage`, published reports, threshold gate | A |
| P3-006 | PR pipeline builds/packages and runs unit tests | Workflow static check plus PR run evidence | A+M |
| P3-007 | PR pipeline runs code coverage | Workflow static check plus PR run artifacts | A+M |
| P3-008 | Client connects to a selected active game and spectates it | `P3-E2E-001` | A |
| P3-009 | Pipeline compiles/bundles, tests, covers, and synthesizes IaC | `npm run verify` plus CI run evidence | A+M |
| P3-010 | Every push/merge to `zebanaya-kepler` triggers post-merge CI/CD | Workflow trigger check plus merged-run evidence | A+M |

## Cross-cutting robustness cases

| ID | Required behavior | Evidence | Mode |
| --- | --- | --- | --- |
| XC-001 | Duplicate command/event delivery does not duplicate state | `P2-IDEMP-001..` client and server tests | A |
| XC-002 | Stale command/event cannot roll authoritative state backward | `P2-STALE-001..` | A |
| XC-003 | Reconnect catches up missing events exactly once before live delivery | `P2-RECONNECT-001..` and `P3-E2E-002` | A |
| XC-004 | Tests use controlled time/observable waits rather than correctness sleeps | Test-code review/lint convention | M |
| XC-005 | Failure artifacts are retained in CI but not committed | CI artifact test and repository-ignore review | A+M |
