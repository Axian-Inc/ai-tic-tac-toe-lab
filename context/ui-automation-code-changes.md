# UI Automation Support Code Changes

Last updated: 2026-03-28

## Summary

Full automation of [ui-test-cases.md](/workspaces/ai-tic-tac-toe-lab/context/ui-test-cases.md) will require targeted application and backend support changes. The current selectors and runtime behavior are adequate for a small smoke test, but not for deterministic coverage of multiplayer discovery, replay, abandonment, stale join, capacity, and forced-error scenarios.

## Feature: Stable Automation Selectors

Implement dedicated `data-testid` attributes for multiplayer and replay surfaces in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx).

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

Implement test-only support endpoints in [server/index.ts](/workspaces/ai-tic-tac-toe-lab/server/index.ts), guarded behind an explicit environment flag.

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

## Feature: Deterministic Confirmation Handling

Replace direct `window.confirm` usage for resignation in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx) with a testable abstraction or app-owned confirmation dialog.

Why:
- Native browser confirms are automatable, but they are less observable and harder to standardize inside a page-object pattern and step wrapper.
- An app-owned dialog would also allow stable selectors and clearer assertions.

## Feature: Observable Multiplayer State Hooks

Expose stable test hooks for state that is currently only inferable from prose text.

Recommended additions:
- current session role
- game lifecycle status
- replay active versus live mode
- abandonment countdown container
- sync state value

Why:
- Several manual cases depend on verifying role, state transitions, and replay/live mode without relying on exact user-facing copy.

## Feature: Automation-Friendly Environment Startup

Provide a dedicated automation startup path in repo scripts or configuration.

Recommended additions:
- one command for frontend-only UI automation
- one command for frontend plus backend plus test-support API
- optional isolated backend port configuration per worker if multiplayer parallelism is expanded later

Why:
- The current `dev:full` command is useful manually but is not yet shaped as a deterministic automation runtime contract.
