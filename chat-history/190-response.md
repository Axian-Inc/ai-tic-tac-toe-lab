# Response
Fixed the CORS error by disabling Fastify’s CORS middleware for the Lambda URL (Function URL already adds CORS headers). This removes the duplicate `Access-Control-Allow-Origin` header.

- Updated `src/backend/app.ts` to make CORS optional.
- Updated `src/backend/handler.ts` to set `enableCors: false`.
- Redeployed `TicTacToeApi-dev`.
- Verified preflight now returns a single `Access-Control-Allow-Origin` header.

Please hard refresh the web UI and try “Start New Game” again.
