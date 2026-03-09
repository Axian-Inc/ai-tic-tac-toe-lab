# Phase 2 - Tic Tac Toe - Multiplayer capability

## Game Updates
- A game can be played single-player or multi-player
- A game can be spectated by either players, or by several third parties through the use of an HTTP Server API
- Server that brokers multiplayer games
- Server accepts/validates commands, updates game state, and broadcasts events to listeners via web sockets. 
- Games that are abandoned (other client hasn't moved for 3 minutes) are marked "over" by the server and a winner is broadcasted. 
- Either client can probe the server for an abandonment check/decision.
- Websockets tell clients when a remote move has happened.
- Clients suggest moves (“I would like to make move Z, in THIS game”) and the server validates the move, before broadcasting it to listeners.
- Server allows for 25 concurrent multiplayer games (at which point issues HTTP 429s)
- Enough data is stored to replay old games (and catch up to live games)
- A player can resign a game (game ends, other player wins)
- System has no auth/identity for users
- Candidate API
    - POST /games (create)
    - GET /games?status=waiting|active|over
    - POST /games/{id}/join
    - POST /games/{id}/moves
    - POST /games/{id}/resign
    - POST /games/{id}/spectate (or just websocket subscribe)
    - POST /games/{id}/abandonment-check
    - WS /ws?gameId=... 

## Infrastructure Concerns
- IaC is updated to capture new resources
- Deploys into AWS with low cost

## S3 Static Website client Updates:
- Start a Multiplayer game (creates a new game for another player to join)
- Join a Multiplayer game (join an existing game, and start it [stopping other players from joining])