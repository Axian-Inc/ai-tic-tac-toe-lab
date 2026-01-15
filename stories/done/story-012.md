# Story 012

## Title
- Adopt shared schemas in backend, web, and CLI with test-first checks

## Context
- Consumers must rely on shared schemas to avoid drift.

## Problem Statement
- Without adoption in each consumer, shared contracts provide limited value.

## Inputs
- Shared schemas and types from `src/shared`.

## Outputs
- Backend, web UI, and CLI import and use shared schemas/types.

## Acceptance Criteria
- [x] For each consumer (backend, web, CLI), add a small test or typecheck fixture first that fails without the shared schema import, then wire the import to pass.
- [x] Backend validates requests/responses with shared zod schemas.
- [x] Web UI and CLI use shared types for API request/response handling.
- [x] At least one integration or smoke test per consumer references shared types.

## Definition of Done
- [x] Builds and tests pass for all consumers.
- [x] No duplicate schema definitions remain in consumer code.

## Dependencies
- Story 011 (schema refinements complete).

## Notes
- Keep integration changes minimal and targeted to validation/type usage.
- No duplicate request/response schemas found in consumers.
- Tests run: `npm test`.

## Assumptions/Questions
- CLI package does not exist yet; create minimal `src/cli` helpers and tests that use shared schemas without implementing full CLI behavior.

## Plan
- [x] Add backend, web, and CLI tests that directly reference shared schemas/types.
- [x] Create minimal CLI helper module that uses shared types and API client.
- [x] Update any consumer code that still defines duplicate request/response shapes.
- [x] Run relevant tests or note why they were not run.

## Done
- Shared schema/type usage covered by backend, web, and CLI tests.
- Minimal CLI helpers created without overlapping the full CLI story scope.
