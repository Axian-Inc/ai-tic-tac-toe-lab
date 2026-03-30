# UI Automation Support Code Changes

Last updated: 2026-03-30

## Summary

The baseline support changes required for deterministic Playwright expansion are now in place. The application and backend now expose automation-stable selectors, a guarded backend test-support API, an app-owned resign confirmation dialog, and serialized full-mode runtime behavior for the shared multiplayer backend.

## Feature: Stable Automation Selectors

Implemented dedicated `data-testid` attributes for multiplayer and replay surfaces in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx).

Required additions:
- multiplayer modal container
- modal close button
- player-name input
- game-name input
- create tab button
- join tab button
- create submit button
- create cancel button
- discovery refresh button
- modal error message
- empty-state message
- waiting games list
- active games list
- per-game cards keyed by game ID
- join and spectate buttons keyed by game ID
- multiplayer session card
- match ID text
- live sync status
- refresh match button
- gameplay error message
- replay panel
- replay start, back, next, and return-to-live buttons
- resignation button
- timeout button
- loss-feedback text

Why:
- Current automation would otherwise depend heavily on visible text and DOM shape, which will make the suite brittle.

## Feature: Deterministic Test Support API

Implemented test-only support endpoints in [server/index.ts](/workspaces/ai-tic-tac-toe-lab/server/index.ts), guarded behind `AUTOMATION_TEST_SUPPORT=1`.

Required capabilities:
- reset in-memory game state
- seed waiting game
- seed active game with chosen board state and player assignments
- seed replay history and lifecycle events
- seed abandonment state with configurable remaining time or expired deadline
- seed store to 25 waiting-or-active games for capacity testing
- mark one game as already joined to drive stale-join failure deterministically
- optionally force specific API failures for create, discovery, detail refresh, join, resign, move, and abandonment-check paths

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
- current session role
- game lifecycle status
- replay active versus live mode
- abandonment countdown container
- sync state value

Why:
- Several manual cases depend on verifying role, state transitions, and replay/live mode without relying on exact user-facing copy.

## Feature: Replay Page Object Surface

Added a dedicated replay page object in [tests/e2e/page-objects/ReplayPanel.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/page-objects/ReplayPanel.ts) and exposed it through the shared fixture in [tests/e2e/fixtures/test-fixture.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/fixtures/test-fixture.ts).

Why:
- The automation plan treats replay controls as a first-class surface, so tests should not have to fall back to raw locators for replay-only interactions.

## Feature: Automation-Friendly Environment Startup

Provided a dedicated automation startup path in repo scripts and configuration.

Recommended additions:
- one command for frontend-only UI automation
- one command for frontend plus backend plus test-support API
- optional isolated backend port configuration per worker if multiplayer parallelism is expanded later

Why:
- The full-mode Playwright runtime now provides the deterministic automation contract; isolated backend ports remain a future optimization if worker parallelism is expanded.
