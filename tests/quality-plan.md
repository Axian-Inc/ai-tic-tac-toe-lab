# Quality Plan

## Purpose

This plan independently demonstrates the behavior in Phases 1 through 3. The
[`acceptance matrix`](acceptance-matrix.md) is the traceability source of truth.
Tests assert public behavior and frozen contracts, not private implementation
details. An unmet expectation is reported as a product defect; it is not
weakened to match the implementation.

## Test layers

| Layer | Scope | Required command | Isolation |
| --- | --- | --- | --- |
| TypeScript domain unit | State, turns, ordered moves, all win lines, draw, illegal moves, deterministic CPU | `npm run test:unit` | Pure, no network or browser |
| React component | Status and controls, enabled cells, pointer and keyboard feedback, quit/rematch, multiplayer/spectator controls | `npm run test:unit` | DOM with controlled sound/confetti adapters |
| .NET unit | Aggregate commands, validation, win/resign/abandonment, sequence/idempotency rules | `npm run test:server` | In-memory fakes and injected clock |
| Contract parity | Shared game-rule vectors in TypeScript and C#; frozen HTTP/event examples | `npm run test:unit` and `npm run test:server` | Versioned contract fixtures |
| Service integration | API, persistence, concurrency, catch-up, WebSocket fan-out | `npm run test:server` | Ephemeral/local AWS-compatible dependencies |
| Browser acceptance | Single-player, two-player, reconnect, and spectator journeys | `npm run test:e2e` | Isolated Playwright browser contexts |
| Coverage | Game core, client behavior, and server behavior | `npm run coverage` | Machine-readable plus HTML artifacts |
| Delivery verification | Bundle/package and infrastructure synthesis | `npm run build`, `npm run infra:synth`, `npm run verify` | No production mutation |

All required commands return nonzero on failure and work without an IDE. Tests
must not rely on execution order, shared mutable games, wall-clock delays, or
an already-deployed environment unless explicitly classified as deployment
smoke evidence.

## Phase 1 scenarios

### Domain and component coverage

- Exercise empty/in-progress/won/drawn/quit states, alternating turns, ordered
  move history, all eight win lines, and moves rejected for occupied cells,
  invalid coordinates, wrong actor, or terminal games.
- Run shared rule vectors against the TypeScript game core. The vector format
  is coordinator-owned; quality does not create it before it is frozen.
- Call the CPU repeatedly with identical states and assert the same legal move.
  Include boards with one legal move and boards requiring its documented
  priority rule. A separate golden journey proves the CPU is beatable.
- Component tests assert text/status and accessible enabled/disabled semantics.
  Valid-cell feedback must work with pointer and keyboard focus; occupied and
  terminal cells must not present an actionable affordance.
- Sound and confetti are tested through observable adapters/events: one move
  sound per accepted placement, win celebration plus winning sound for a human
  win, losing sound plus written/visual retry feedback for a CPU win, and none
  for rejected moves. Browser smoke confirms the real assets can initialize.

### Deterministic full games

`P1-E2E-001` starts at the landing page, selects play versus CPU, follows a
coordinator-approved fixed cell sequence, observes alternating turns and move
feedback, completes a human win, and asserts the winner, confetti, and winning
sound signal. It then rematches and proves a fresh board and initial turn.

`P1-E2E-002` follows a fixed sequence ending in a CPU win and asserts the
losing signal and “try again” feedback. `P1-E2E-003` quits an in-progress game
and proves no later move can be placed. No journey discovers moves randomly;
its sequence is derived from the frozen CPU rule and board-coordinate contract.

## Phase 2 scenarios

### Server behavior and controlled time

- Cover create, filtered list, exclusive second-player join, validated moves,
  ordered history, wins, resignation, and rejection of commands for the wrong
  game/player/state. No identity assumptions are made until the coordinator
  freezes the no-auth player-token/seat mechanism.
- Inject a clock. At `lastAcceptedMove + 2m59.999s`, abandonment does not end
  the game; at the exact frozen boundary it has the contract-defined result.
  Check both players probing, repeated probes, a probe after a newer accepted
  move, a probe after another terminal result, and concurrent probes. Exactly
  one terminal event is persisted and broadcast.
- Prove ordered events can rebuild state and that an initial snapshot/catch-up
  has an unambiguous handoff point to live delivery.

### Atomic capacity test

`P2-CAP-001` starts from zero active games, releases 26 independent create
requests at one barrier, and waits for all responses. Exactly 25 succeed,
exactly one receives HTTP 429, persisted active-game count never exceeds 25,
and every successful identifier is unique. Repeat the test enough times in an
isolated stress job to expose races. Then end one game and prove exactly one
new creation succeeds. Capacity tests must exercise the real atomic persistence
path; a mocked repository is insufficient.

### Idempotency, stale delivery, and reconnect

- Repeat the same coordinator-defined command id: one state transition and one
  event, with the frozen replay response.
- Submit different commands based on a stale sequence/version and verify the
  frozen conflict response without a state change.
- Deliver the same event twice and deliver an older event after a newer one;
  the client renders each accepted move once and never rolls state backward.
- Disconnect after a known sequence, advance the game remotely, reconnect,
  catch up only missing ordered events, and then receive a live event without
  a gap or duplicate.
- Exercise a dropped connection during the snapshot-to-live boundary so an
  event cannot be lost between catch-up and subscription.

### Two-player browser context

`P2-E2E-001` creates isolated Playwright contexts A and B. A creates a waiting
game, B discovers and joins it, a third join is rejected, and both contexts
show active state. They alternate a deterministic legal sequence; after each
move the remote context observes the update without reload. The journey proves
one win and corresponding win/lose feedback. Separate cases cover resignation,
reconnect/catch-up, and preservation of Phase 1 single-player behavior.

## Phase 3 scenarios

### Spectator browser context

`P3-E2E-001` uses player contexts A/B plus spectator context S. A and B start
and make multiple moves. S opens the active-game list, selects the game, and
receives current ordered state. After a synchronization marker, A makes another
move and S observes it live. S has no enabled move/resign controls, and a
direct spectator command attempt is rejected by the server without mutation.

`P3-E2E-002` deliberately races a player move with S joining. S must converge
to exactly the authoritative ordered history with no missing or duplicate
move, demonstrating catch-up-before-live semantics. Multiple spectator
contexts must not consume player seats.

## Reliability and environments

- Wait for role/status text, responses, or sequence markers; never use fixed
  sleeps for correctness. A polling interval is allowed only with an explicit
  total timeout and diagnostic output.
- Use unique test-run/game identifiers and dispose resources after each test.
- Freeze randomness, time, CPU policy, and browser locale/timezone where they
  affect assertions.
- Retry infrastructure setup only. A test that passes on a test-level retry is
  reported flaky and blocks the phase unless the coordinator records a ticketed
  waiver.
- On browser failure retain trace, screenshot, video-on-first-retry, console,
  page errors, failed requests, and relevant server correlation IDs.
- CI runs unit tests before integration, but failures are independently
  reproducible. Concurrency tests run serially relative to other capacity tests.

## Coverage and reporting

Coverage is reported separately for `game-core`, meaningful React logic, and
the .NET server; generated/vendor/IaC declaration files are excluded only with
documented rationale. Initial merge thresholds are 90% line and 85% branch for
game core, 80% line and 75% branch for server application/domain code, and 75%
line and 65% branch for testable client logic. The coordinator may ratify or
change these before Phase 3, but thresholds never decrease merely to pass CI.

Required behavioral cases—including all win lines, illegal moves, capacity,
abandonment boundaries, idempotency, reconnect, and spectator authorization—
remain mandatory regardless of percentage. CI publishes HTML and machine-
readable coverage and test reports, shows a PR summary, and fails when a frozen
threshold or required suite fails.

## Entry and exit rules

A test may be implemented once its referenced contract is frozen and the root
test command exists. A phase exits only when every matrix row is Passed or has
a coordinator-approved, ticketed manual classification; all required suites
pass from a clean checkout; reports identify commit SHA; and no required test
is quarantined or flaky. AWS deployment rows additionally require evidence
from the named LnD account but automated tests and synthesis must not perform
an unapproved deployment.
