# Tester Guide

## Purpose
This guide describes what to verify across the updated tic-tac-toe application: local gameplay, CPU gameplay, online multiplayer, backend API behavior, and Terraform-managed deployment.

## Test Surface
Test these areas when changes touch the application:

- Landing page setup and validation.
- Local `Player vs Player` gameplay.
- `Player vs CPU` gameplay and feedback.
- Online create, join, spectate, reconnect, move, and resign flows.
- API validation and error responses.
- WebSocket subscription and event delivery.
- Terraform plan, outputs, and deployed smoke checks.

## Automated Test Coverage
API tests live in `api/tests`.

- `domain.test.ts`: display-name validation, game creation, joining, move validation, terminal states, abandonment, public summaries, and concurrent-game state classification.
- `http.test.ts`: HTTP routing, health checks, invalid input, create game, list games, event query validation, and public response shape.

UI tests live in `ui/tests`.

- `app.spec.ts`: end-to-end UI flow and user-facing behavior.
- `game.spec.ts`: pure game-engine behavior.
- `game-session.spec.ts`: Zustand session-store behavior.
- `full-game.spec.ts`: complete winning flows.
- `online-session.spec.ts`: mocked online API/WebSocket flows, online state normalization, spectators, moves, and lobby summaries.

The pull request workflow runs API build, API coverage, UI build, and UI coverage. Coverage artifacts are uploaded for both packages.

## Test Commands
API:

```bash
cd api
npm ci
npm run typecheck
npm test
npm run coverage
npm run build
```

UI:

```bash
cd ui
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm run lint
npm test
npm run coverage
npm run build
```

Terraform validation:

```bash
npm --prefix api run build
terraform -chdir=terraform init
terraform -chdir=terraform fmt -check
terraform -chdir=terraform validate
terraform -chdir=terraform plan
```

Use an isolated Terraform workspace for apply-level testing.

## Manual Test Checklist
### Landing Page
1. Open the app.
2. Confirm the landing page loads before any board.
3. Confirm empty names are rejected.
4. Confirm names with spaces or unsupported symbols are rejected.
5. Confirm letters, numbers, underscores, and hyphens are accepted.
6. Confirm the name field is limited to 24 characters.
7. Confirm local modes can start without online API configuration.
8. Confirm online mode shows a clear configuration error when API URLs are missing.

### Player vs Player
1. Start a PvP game with a valid name.
2. Confirm the matchup label uses `<name> vs <name>`.
3. Confirm the board has 9 cells.
4. Play a normal game and verify turn changes.
5. Confirm occupied cells cannot be played again.
6. Finish a win and verify winner text and move history.
7. Finish a draw and verify draw text.
8. Start a new game and confirm board and history reset.
9. Click `Quit game` and confirm the landing page returns.

### Player vs CPU
1. Start a CPU game with a valid name.
2. Confirm exactly one mark is human-controlled and one is CPU-controlled.
3. Confirm the UI tells the player which mark they control.
4. Confirm the CPU responds immediately after a human move.
5. Confirm CPU-first initialization works when the CPU is randomized as starter.
6. Confirm human interaction is blocked during CPU turns.
7. Finish a CPU loss and verify `You lose`, `Try again`, and `Rematch`.
8. Finish a CPU win and verify celebratory feedback.
9. Click `Rematch` and confirm a fresh CPU game starts.

### Online Lobby
1. Start the UI with `VITE_API_HTTP_URL` and `VITE_API_WS_URL` set.
2. Choose `Online Multiplayer`.
3. Confirm the in-progress game list loads.
4. Confirm `Refresh` reloads the list.
5. Create a game and confirm it enters `waiting_for_players`.
6. Confirm the game id is visible.
7. Confirm waiting games can be joined.
8. Confirm active games are blocked for join and remain available for spectate.
9. Confirm stale or pasted game ids are sent to the server for verification.

### Online Gameplay
Use two browser windows or two different browser contexts.

1. Player A creates a game.
2. Player B joins the game.
3. Confirm both clients show `active` and the same game id.
4. Confirm each player sees their role and opponent information.
5. Make a move as the current player and confirm both clients update from server state.
6. Attempt to move out of turn and confirm the UI blocks the action.
7. Attempt to move as a spectator and confirm the UI blocks the action.
8. Connect a spectator and confirm move history and board state are visible.
9. Resign as a player and confirm the opponent is the winner.
10. Refresh a spectator session and confirm the game view can recover.
11. Refresh a player session and confirm the game view may recover but player move authority is lost.

### API Smoke Checks
Against a deployed API, set:

```bash
API_HTTP_URL="$(terraform -chdir=terraform output -raw api_http_endpoint)"
```

Health check:

```bash
curl "$API_HTTP_URL/api/health"
```

Expected response:

```json
{ "status": "ok" }
```

Create game:

```bash
curl -s -X POST "$API_HTTP_URL/api/games" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice_1"}'
```

Verify the response status is `201`, the game is `waiting_for_players`, and a private `playerToken` is returned.

List games:

```bash
curl -s "$API_HTTP_URL/api/games"
```

Verify summaries do not include `board`, `moveHistory`, `eventHistory`, or `playerTokenHash`.

Negative checks:

- Invalid display name returns `400 INVALID_DISPLAY_NAME`.
- Wrong player token returns `401 INVALID_PLAYER_TOKEN`.
- Out-of-turn move returns `403 NOT_YOUR_TURN`.
- Occupied cell returns `409 CELL_OCCUPIED`.
- Creating more than 25 in-progress games returns `429 GAME_LIMIT_REACHED`.

Do not run the 25-game limit check in a shared environment unless cleanup and workspace isolation are planned.

### Deployment Smoke Checks
After Terraform apply and UI sync:

1. Confirm `terraform output website_url` loads the static site.
2. Confirm `terraform output api_http_endpoint` responds to `/api/health`.
3. Confirm `terraform output api_websocket_endpoint` starts with `wss://`.
4. Confirm creating an online game writes records to the games and events tables.
5. Confirm a WebSocket subscriber receives `subscription.confirmed`.
6. Confirm a move creates `move.accepted` and, when applicable, terminal events.
7. Confirm CloudWatch logs are created for each Lambda handler.

## Regression Risks To Watch
- UI and API display-name validation must match.
- UI online types must stay aligned with API contracts.
- Public API responses must not expose token hashes.
- The online board must use server state, not optimistic client-only state.
- WebSocket reconnect should fetch missed events and refresh game state.
- Terminal online games must decrement the concurrent-game counter.
- Vite API URLs must be set before deployed online mode is tested.

## Reporting Guidance
When filing a bug, include:

- App URL or local command used.
- Browser and operating system.
- Game mode.
- Game id for online issues.
- Player role and mark when relevant.
- Exact move sequence or API request.
- Expected result.
- Actual result.
- Screenshots, video, console errors, network responses, or Lambda log excerpts when available.
