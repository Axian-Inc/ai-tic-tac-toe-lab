# UI Automation Support Code Changes

Last updated: 2026-04-05

## Summary

The baseline support changes required for deterministic Playwright expansion are now in place. The application and backend now expose automation-stable selectors, a guarded backend test-support API, an app-owned resign confirmation dialog, and serialized full-mode runtime behavior for the shared multiplayer backend.

## Feature: Stable Automation Selectors

Implemented dedicated `data-testid` attributes for multiplayer and replay surfaces in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx).

Required additions:
- [x] multiplayer modal container
- [x] modal close button
- [x] player-name input
- [x] game-name input
- [x] create tab button
- [x] join tab button
- [x] create submit button
- [x] create cancel button
- [x] discovery refresh button
- [x] modal error message
- [x] empty-state message
- [x] waiting games list
- [x] active games list
- [x] per-game cards keyed by game ID
- [x] join and spectate buttons keyed by game ID
- [x] multiplayer session card
- [x] match ID text
- [x] live sync status
- [x] refresh match button
- [x] gameplay error message
- [x] replay panel
- [x] replay start, back, next, and return-to-live buttons
- [x] resignation button
- [x] timeout button
- [x] loss-feedback text

Why:
- Current automation would otherwise depend heavily on visible text and DOM shape, which will make the suite brittle.

## Feature: Deterministic Test Support API

Implemented test-only support endpoints in [server/index.ts](/workspaces/ai-tic-tac-toe-lab/server/index.ts), guarded behind `AUTOMATION_TEST_SUPPORT=1`.

Required capabilities:
- [x] reset in-memory game state
- [x] seed waiting game
- [x] seed active game with chosen board state and player assignments
- [x] seed replay history and lifecycle events
- [x] seed abandonment state with configurable remaining time or expired deadline
- [x] seed store to 25 waiting-or-active games for capacity testing
- [x] mark one game as already joined to drive stale-join failure deterministically
- [x] optionally force specific API failures for create, discovery, detail refresh, join, resign, move, and abandonment-check paths

Why:
- Manual timing and shared in-memory state are not reliable enough for CI automation.

Implementation note:
- Added `POST /test-support/seed/stale-join` so automation can present a waiting-list entry that deterministically fails `POST /games/{id}/join` with `not_joinable`.

## Feature: Deterministic Confirmation Handling

Replaced direct `window.confirm` usage for resignation in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx) with an app-owned confirmation dialog.

Why:
- Native browser confirms are automatable, but they are less observable and harder to standardize inside a page-object pattern and step wrapper.
- An app-owned dialog would also allow stable selectors and clearer assertions.

## Feature: Observable Multiplayer State Hooks

Exposed stable test hooks for state that was previously only inferable from prose text.

Recommended additions:
- [x] current session role
- [x] game lifecycle status
- [x] replay active versus live mode
- [x] abandonment countdown container
- [x] sync state value

Why:
- Several manual cases depend on verifying role, state transitions, and replay/live mode without relying on exact user-facing copy.

## Feature: Replay Page Object Surface

Added a dedicated replay page object in [tests/e2e/page-objects/ReplayPanel.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/page-objects/ReplayPanel.ts) and exposed it through the shared fixture in [tests/e2e/fixtures/test-fixture.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/fixtures/test-fixture.ts).

Why:
- The automation plan treats replay controls as a first-class surface, so tests should not have to fall back to raw locators for replay-only interactions.

## Feature: Automation-Friendly Environment Startup

Provided a dedicated automation startup path in repo scripts and configuration.

Recommended additions:
- [x] one command for frontend-only UI automation
- [x] one command for frontend plus backend plus test-support API
- [ ] optional isolated backend port configuration per worker if multiplayer parallelism is expanded later

Why:
- The full-mode Playwright runtime now provides the deterministic automation contract; isolated backend ports remain a future optimization if worker parallelism is expanded.

## Feature: RemoteCDP Host Browser Support

Added browser-target runtime support so UI automation can run either against a Playwright-launched local browser or a host Chrome instance exposed through RemoteCDP.

Required additions:
- [x] browser target selection through `UI_AUTOMATION_BROWSER_TARGET=Local|RemoteCDP`
- [x] RemoteCDP endpoint override through `UI_AUTOMATION_REMOTE_CDP_ENDPOINT`
- [x] forced worker cap of `1` for RemoteCDP sessions
- [x] fixture-level `connectOverCDP(...)` path that preserves the existing local browser flow as the default
- [x] RemoteCDP support applied through the shared e2e fixture layer so specs do not need browser-mode-specific code

Why:
- Demo, maintenance, and future UI debugging workflows need a visible host browser outside the container without changing the default CI/browser behavior.

## Requested Change: Single-Player Seed Support for UI-004

`UI-004` currently remains skipped for the player-win portion because the current deterministic minimax CPU may not expose a real UI-playable player-win path.

Requested additions:
- [ ] add a frontend-only or test-only hook that can initialize single-player gameplay from a provided `GameState`
- [ ] expose a safe automation path to open gameplay with seeded single-player board, move history, current player, and terminal/non-terminal status
- [ ] use that support to automate the player-win half of `UI-004` without weakening production CPU behavior

Why:
- The current manual requirement expects coverage of a player-win outcome, but that outcome is not guaranteed to be reachable through the live UI against the shipped deterministic CPU. A seeded single-player automation path would make the scenario deterministic without changing real gameplay behavior.
