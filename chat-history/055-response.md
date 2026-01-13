# Response
Recorded that `/new-game` returns only initialized state and AI-first moves are triggered via `/move`.

Architecture step 31 (session identity): Since the API is stateless, do you still want a lightweight `sessionId` for logging/trace correlation, or skip it?
