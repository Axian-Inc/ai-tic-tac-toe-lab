# Response
For the simplest web UI flow, I’d use a thin backend service that owns game state and Bedrock calls, with the React UI as a client.

Minimal web architecture:
- React UI: render board, send player moves, display AI response.
- Backend API: endpoints like `/new-game`, `/move`, `/state`.
- Game engine (server-side): validate moves, detect win/draw, maintain state.
- AI move service (server-side): build prompt from state/rules/strategy and call Bedrock.
- Storage: in-memory per session for POC, with optional persistence later.

Clarifying: do you want the backend to be stateless (client sends full board each move) or stateful (server holds sessions/boards)?
