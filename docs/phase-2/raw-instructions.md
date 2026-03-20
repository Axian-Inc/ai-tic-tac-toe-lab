Tic Tac Toe - Multiplayer
Update system to now have:

HTTP API Server that brokers multiplayer games

Server accepts/validates commands, updates game state, and broadcasts events to listeners via web sockets. 

A game can be spectated by either players, or by several third parties.

Candidate API

POST /games (create)

GET /games?status=waiting|active|over

POST /games/{id}/join

POST /games/{id}/moves

POST /games/{id}/resign

POST /games/{id}/spectate (or just websocket subscribe)

POST /games/{id}/abandonment-check

WS /ws?gameId=... 

Games that are abandoned (other client hasn't moved for 3 minutes) are marked "over" by the server and a winner is broadcasted. 

Either client can probe the server for an abandonment check/decision.

Websockets tell clients when a remote move has happened.

Clients suggest moves (“I would like to make move Z, in THIS game”) and the server validates the move, before broadcasting it to listeners.

Server allows for 25 concurrent multiplayer games (at which point issues HTTP 429s)

Enough data is stored to replay old games (and catch up to live games)

Tests cover the server’s key behavior (e.g. game creation max, abandonment).

A player can resign a game (game ends, other player wins)

System has no auth/identity for users

Infrastructure Concerns

IaC is updated to capture new resources

Deploys into AWS with low cost

Update client to now have:

Start a Multiplayer game (creates a new game for another player to join)

Join a Multiplayer game (join an existing game, and start it [stopping other players from joining])

Exit Criteria
A Tic Tac Toe app that has a single-player and a multiplayer feature

Single player games (against local computer) work as described in Phase 1 (see above). Playwright tests still pass.

App receives in-game multiplayer updates via websocket.

App allows users to both Create New and Join (Waiting) Multiplayer games.

Up to 25 concurrent games can run concurrently.

Game state and move history/order are preserved.

Players can create and join each other’s multiplayer games.

Tests that cover multiplayer behavior (create games, moves).

Players can win/lose together at tic tac toe.

Multiplayer updates are received async.

IaC updated to hold new infrastructure footprint.