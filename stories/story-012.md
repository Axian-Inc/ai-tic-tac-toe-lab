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
- [ ] For each consumer (backend, web, CLI), add a small test or typecheck fixture first that fails without the shared schema import, then wire the import to pass.
- [ ] Backend validates requests/responses with shared zod schemas.
- [ ] Web UI and CLI use shared types for API request/response handling.
- [ ] At least one integration or smoke test per consumer references shared types.

## Definition of Done
- [ ] Builds and tests pass for all consumers.
- [ ] No duplicate schema definitions remain in consumer code.

## Dependencies
- Story 011 (schema refinements complete).

## Notes
- Keep integration changes minimal and targeted to validation/type usage.
