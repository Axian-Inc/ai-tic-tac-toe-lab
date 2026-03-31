# Project Organization

## Top-Level Layout

- `src/`: application source
- `shared/`: client/server shared contracts and protocol types
- `server/`: planned multiplayer backend location
- `tests/`: automated tests
- `docs/`: human-facing architecture and organization notes
- `infra/`: deployment baseline and infrastructure files
- `phases/`: phase requirements and visual references

## Source Layout

### `src/app/`

Application entry composition.

- `App.tsx`: screen routing between landing and in-game flow, plus CPU turn orchestration

### `src/pages/`

Top-level page components.

- `LandingPage.tsx`: start screen for local single-player mode
- `GamePage.tsx`: active game screen, status messaging, and feedback UI
- `MultiplayerLobbyPage.tsx`: create/join waiting-game flow
- `MultiplayerGamePage.tsx`: live multiplayer board and server-backed match status

### `src/features/game/components/`

Reusable feature-facing UI pieces.

- `BoardPreview.tsx`: board rendering, hover behavior, and click wiring

### `src/features/game/model/`

Pure domain logic.

- `game.ts`: state, moves, validation, winner/draw detection
- `cpu.ts`: deterministic CPU move selection
- `index.ts`: barrel exports for the game feature

### `shared/contracts/`

Client/server protocol definitions.

- `multiplayer.ts`: Phase 2 HTTP payloads, WebSocket events, identifiers, and capacity constants
- `index.ts`: barrel exports for shared contracts

### `src/features/multiplayer/`

Browser-side multiplayer helpers.

- `api.ts`: HTTP requests and WebSocket subscription helpers
- `mappers.ts`: conversion from multiplayer snapshots to board render state

### `server/`

Backend ownership boundary for upcoming Phase 2 implementation stories.

- `README.md`: planned responsibilities for the multiplayer HTTP and WebSocket server
- `index.ts`: API process entry point
- `http/createApp.ts`: HTTP routing and JSON response handling
- `multiplayer/service.ts`: in-memory multiplayer lifecycle and validation logic
- `realtime/attachRealtimeServer.ts`: WebSocket upgrade handling and per-game event fan-out

### `src/styles/`

Global and app-specific styling.

- `global.css`: document-level defaults
- `app.css`: landing/game layouts and component states

## Test Layout

### `tests/unit/`

Fast domain-level verification.

- `game.test.ts`: state evolution, legality, draw/win detection, and CPU behavior
- `multiplayer-contracts.test.ts`: shared Phase 2 contract baseline and constants

### `tests/server/`

Server API verification.

- `multiplayer-api.test.ts`: end-to-end HTTP lifecycle coverage for create, list, join, move, resign, and abandonment-check
- `multiplayer-websocket.test.ts`: snapshot-on-connect and live WebSocket broadcast coverage

The API test file now also covers:

- concurrent game-cap rejection
- pre-join resign rejection
- premature abandonment no-op behavior
- invalid abandonment timestamp rejection
- active-game spectator discovery and per-game snapshot reads

### `tests/e2e/`

Browser-level verification.

- `single-player.spec.ts`: complete winning game flow through the UI
- `multiplayer.spec.ts`: two-client create/join/live-move browser flow

## Infrastructure Layout

### `infra/cloudformation/`

AWS baseline templates for low-cost deployment.

- `static-site.yml`: S3 website hosting baseline for the frontend
- `multiplayer-api.yml`: single-instance EC2 baseline for the multiplayer API

### `infra/deploy-static-site.sh`

Convenience deployment script for the Phase 1 static site.

### `infra/package-multiplayer-api.sh`

Creates the packaged multiplayer API artifact used by the Phase 2 server deployment.

### `infra/deploy-multiplayer-api.sh`

Uploads the API artifact and deploys the multiplayer API CloudFormation stack.

### `infra/README.md`

How the baseline works, what AWS inputs are needed, and how to run it.
