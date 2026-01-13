# Response
Added a `/new-game` endpoint to initialize state based on UI selections.

Architecture step 30 (AI-first move): If the AI is selected to start, should `/new-game` immediately return an AI move applied, or should the client call `/move` next to trigger the AI?
