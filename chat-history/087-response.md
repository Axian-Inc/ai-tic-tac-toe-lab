# Response

Not fully ready to begin test-first across all stories. We can start with Story 001/002 once a few gaps are clarified, but Stories 003–004 need additional decisions to write deterministic tests.

- Error contract: define the canonical `errorCode` list and map to HTTP status (400 vs 409) for each case.
- State consistency rules: specify validation for move counts, `nextPlayer`, and `winner/gameStatus` combinations so schema + rules tests know what is invalid.
- `/v1/new-game` behavior: confirm sessionId generation, initial `moveHistory`, and whether startingPlayer=O requires an immediate AI move or a client follow-up `/move`.
- Opponent profiles: provide opponent IDs, prompt variants, and the deterministic must-do scenarios per profile.
- AI output parsing: confirm if `rationale` is required/optional and whether extra keys are rejected or ignored.

If you confirm the above, I can start test-first implementation with Story 001 (schemas/tests) and Story 002 (game rules/tests) while we lock down the AI/profile details for Story 004.

Next steps:
1) Define the `errorCode` catalog and state consistency rules.
2) Confirm `/v1/new-game` initialization fields.
3) List opponent profiles and must-do scenarios.
