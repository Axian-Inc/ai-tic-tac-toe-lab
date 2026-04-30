# Cave Man Guide

## Big Thing
You play mark game.

Board have 9 square.

You put `X` or `O`.
Other human, CPU brain, or far-away human put other mark.

Three same mark in line mean win.
All square full and no line mean draw.

Now game have three big parts:

- `ui/` is shiny game face.
- `api/` is server brain for far-away game.
- `terraform/` make cloud cave where game live.

## Open Game
Use big web place:

http://ai-tic-tac-toe-lab-jhart-tic-tac-toe-590316689173.s3-website-us-west-2.amazonaws.com

If dev cave run game on own rock, use local link that dev server show.

## Name Rule
Before play, put name.

Name must be:

- 1 to 24 marks long.
- Letter, number, `_`, or `-`.
- No space.

Good name:

- `Bob`
- `Bob_1`
- `Bob-1`

Bad name:

- Nothing.
- `Bob Smith`
- `Bob!`

## Pick Fight
### `Player vs Player`
Two humans share same board.

Same cave. Same screen.

### `Player vs CPU`
Human fight machine brain.

Game tell you if you are `X` or `O`.

Machine brain move right away when machine turn happen.
Sometimes machine brain go first.

### `Online Multiplayer`
Human fight far-away human.

Server brain is boss.
Browser ask. Server decide.

You can:

- Make new online room.
- Join waiting room.
- Watch room as spectator.

If room already active, you no join as player.
You only watch.

## Make Local Game
1. Put name.
2. Pick `Player vs Player` or `Player vs CPU`.
3. Hit `Start game`.

## Make Online Game
1. Put name.
2. Pick `Online Multiplayer`.
3. Pick `Create`.
4. Hit `Create game`.
5. Copy game id.
6. Give game id to other human.

Game wait until second human join.

## Join Online Game
1. Put name.
2. Pick `Online Multiplayer`.
3. Pick `Join`.
4. Pick waiting game from list, or paste game id.
5. Hit `Join game`.

Game list refresh by itself.
Also `Refresh` button make list fresh now.

## Watch Online Game
1. Put name.
2. Pick `Online Multiplayer`.
3. Pick `Spectate`.
4. Pick game from list, or paste game id.
5. Hit `Spectate game`.

Watcher see board.
Watcher no put mark.
Watcher no resign.

## During Fight
Game show:

- State.
- Mode.
- Current player.
- Controller.
- Winner.
- Move count.
- Move history.

Online game also show:

- Game id.
- Connection status.
- Role.
- Opponent.

Empty playable square mean you can bonk there.
Full square mean no.
Locked square mean wait.

## End Fight
Win:

- Game say who win.
- Happy sound.
- Confetti fly.

CPU beat you:

- Game say `You lose`.
- Game say `Try again`.

Draw:

- Game say `Draw`.

Online resign:

- Human who stay win.

Online timeout:

- Human whose turn rot too long lose.
- Other human win.

## Button Thing
### `New game`
Start new local fight with same local mode.

### `Mode`
Change local fight type.
Old board go away.
Fresh board come.

### `Rematch`
After CPU fight end, fight CPU again.

### `Create new online game`
Make fresh online room with same name.

### `Resign`
Online player give up.
Other player win.

### `Quit game`
Leave board.
Go back start screen.
If online, browser disconnect from room.

## Server Brain
Server brain live in `api/`.

Server brain do these things:

- Make game.
- Join game.
- Keep board.
- Check turn.
- Check cell.
- Find win.
- Find draw.
- Handle resign.
- Handle timeout.
- Save move events.
- Tell connected browsers what happen.

Server brain give player secret token.
Token let player move or resign.
Public game data never show token hash.

## Server Mouth
HTTP mouth speak these paths:

- `GET /api/health` say server ok.
- `POST /api/games` make game.
- `GET /api/games` list waiting and active games.
- `GET /api/games/{gameId}` show whole public game.
- `GET /api/games/{gameId}/events` show event trail.
- `POST /api/games/{gameId}/join` join waiting game.
- `POST /api/games/{gameId}/moves` make move.
- `POST /api/games/{gameId}/resign` give up.
- `POST /api/games/{gameId}/abandonment-check` check timeout.

WebSocket mouth keep long fire signal.
Browser subscribe.
Server send event when game change.

## Cloud Cave
Terraform live in `terraform/`.

Terraform make AWS things:

- S3 bucket for shiny game face.
- HTTP API Gateway for server mouth.
- WebSocket API Gateway for long fire signal.
- Lambda for server brain.
- DynamoDB tables for games, events, connections, and counters.
- IAM rules so brain can touch only things it need.
- CloudWatch logs so dev can see smoke.

Terraform output give:

- Website URL.
- HTTP API URL.
- WebSocket API URL.

## Dev Cave Commands
API:

```bash
cd api
npm ci
npm run typecheck
npm test
npm run build
```

UI:

```bash
cd ui
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Terraform:

```bash
npm --prefix api run build
terraform -chdir=terraform init
terraform -chdir=terraform validate
terraform -chdir=terraform plan
```

UI need online magic words before online work:

```bash
VITE_API_HTTP_URL="https://server-mouth" \
VITE_API_WS_URL="wss://long-fire-signal" \
npm --prefix ui run build
```

No magic words mean local fight still work.
Online fight say not configured.

## Tester Cave Checks
Check these:

- Name rule same in UI and API.
- Local board have 9 square.
- No move on full square.
- No move after win or draw.
- CPU move legal.
- CPU can start first.
- Online create make waiting game.
- Online join make active game.
- Online spectator can watch but not move.
- Online server reject bad token.
- Online server reject wrong turn.
- Online server reject full square.
- WebSocket event make other browser fresh.
- Terraform output URLs work.
- Public game never show secret token hash.

## Cave Truth
- Local game live in browser memory.
- Online game live in server brain.
- Server brain is boss for online game.
- Browser refresh can bring watcher view back.
- Browser refresh may lose player power because token stay only in memory.
- Max 25 waiting or active online games at same time.
- Timeout is 3 minute turn.
