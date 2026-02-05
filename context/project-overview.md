# Project Overview (Draft)
Date: 2026-02-05

## Purpose
Build a local-only single-player Tic-Tac-Toe game and use Generative AI throughout the development lifecycle (requirements refinement, testing, code generation, documentation).

## Primary Goals
- Practice thoughtful, repeatable use of Generative AI across the lifecycle, not just code generation.
- Use AI to generate/enrich stories from coarse requirements.
- Use AI to accelerate/enable testing.
- Use AI for code generation.
- Use AI for project documentation (updating context).

## Scope (Phase 1)
- React + TypeScript local-only Tic-Tac-Toe app.
- Game logic in a dedicated Game module (state, moves, turn, win detection) with unit tests covering key behaviors.
- Landing page: greet user, allow new game (e.g., “Play vs. CPU”).
- In-game detail: show turn status and game outcome.
- UX feedback: confetti + win sound on win; lose sound + “try again” feedback on loss; “thud” sound on move.
- UI prevents illegal moves and provides valid/invalid move feedback (e.g., hover).
- Game can be quit; after CPU game ends, offer Rematch.
- Deterministic CPU opponent (same board => same move).
- Playwright script that plays a full game including a winning scenario.
- CLI-runnable unit and Playwright tests (CI-automatable).
- Project is well documented, README included.
- IaC and deployment to Axian’s LnD AWS account.

## References
- Phase 1 work items: docs/Phase_1_Work_Items.md

## Decisions
- Audio assets will be sourced from free/licensed sources or generated if needed.
- No confetti library preference; select an appropriate option during implementation.
- Basic accessibility requirements; UI must be fully testable with automation frameworks.
- Target: all modern browsers.
- No CI setup initially; deploy from local dev machine.
- Player/CPU mark selection should be selectable, with option to randomize.
- Rematch starting player should be random.
- A Quit action should return to landing and reset game state.
- Confetti always enabled; sound has a user toggle.

## Out of Scope
- Multiplayer / online play.
- Non-deterministic CPU.
- Mobile native app.

## Stakeholders
- TBD (provide names/roles).

## Open Questions
- Deployment target specifics (AWS services to use)?
