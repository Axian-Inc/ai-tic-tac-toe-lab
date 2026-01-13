# Response
Noted that AI rationale should be returned in the API response for UI display and POC testing.

Architecture step 7 (errors/fallbacks): If the AI returns an invalid move or times out, should the backend retry, fall back to a deterministic move (e.g., first available), or return an error to the client?
