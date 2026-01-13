# Response
Added shared move/error schemas with test coverage to satisfy Story 010, and updated the story plan to reflect progress. The new tests cover valid and invalid payloads, while the schemas live alongside `GameState` and are exported for consumers.

Details
- New schemas and types: `src/shared/moveSchemas.ts`.
- Tests: `src/shared/__tests__/moveSchemas.test.ts`.
- Export surface updated in `src/shared/index.ts`.
- Story tracking updated in `stories/story-010.md` (plan progress, test note).

Tests not run.

Next steps (pick one)
1. Run `npm test -- src/shared/__tests__/moveSchemas.test.ts`.
2. Run full test suite with `npm test`.
3. Continue to Story 011 if you want me to proceed without running tests.
