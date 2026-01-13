# Coding Standards

## Languages and Frameworks
- TypeScript across backend, web, CLI, and shared modules; avoid `any` and prefer explicit types.
- Backend: Fastify routes are thin; business logic lives in services/modules under `src/backend`.
- Web: React functional components with hooks; keep UI state local, lift shared state to parent.
- Shared: `zod` schemas in `src/shared` are the single source of truth for validation and types.
- Node.js 18+ APIs only (aligned with Lambda runtime and CLI).

## Formatting and Linting
- Follow repo formatter/linter configs; do not hand-format code that tools can format.
- Keep imports grouped: stdlib, third-party, internal; remove unused imports.
- Prefer early returns over deep nesting; keep functions focused and short.

## Naming Conventions
- Files/dirs: `kebab-case` except React components (`PascalCase.tsx`).
- Functions/vars: `camelCase`; types/interfaces/enums: `PascalCase`.
- Constants and env vars: `UPPER_SNAKE_CASE`.
- API routes: `/v1/...` with nouns for resources and verbs only when necessary.

## Module Boundaries
- `src/shared` is the only cross-layer import; backend never imports `src/web`.
- Web and CLI consume shared types and the API client from `src/shared`.

## API Contracts
- `zod` schemas are the single source of truth for request/response shapes.
- Define and maintain a stable list of `errorCode` values in `src/shared`.
- API versioning is explicit (e.g., `/v1`) and only changes with breaking contract updates.

## Configuration and Secrets
- All configuration comes from environment variables and is validated at startup.
- Never commit secrets or tokens; use `.env` samples when needed.
- Document required env vars and defaults in `context/*.md`.

## Logging and Privacy
- Structured logs only; include `requestId`/`sessionId` for tracing.
- Do not log raw prompts, model outputs, or PII; log redacted summaries instead.

## Dependency Policy
- Prefer lightweight, maintained dependencies; avoid untyped or unmaintained packages.
- Add new deps only when they reduce complexity or enable required capability.

## Error Handling
- Validate all request/response boundaries with `zod`; reject invalid inputs early.
- Use consistent error shape: `errorCode`, `message`, and optional `details`.
- Log errors once with context (requestId/sessionId, opponentId) via `pino`.
- Treat AI responses as untrusted: validate schema, retry on invalid output, then fail cleanly.

## Testing
- Use `vitest` for unit tests; `@testing-library/react` for UI behavior tests.
- Cover game rules, move validation, and AI response parsing with deterministic cases.
- Prefer pure functions for logic to keep tests fast and isolated.

## PR Checklist
- Code follows `context/coding-standards.md` and matches TypeScript/React conventions.
- Inputs/outputs validated with `zod` where crossing boundaries.
- Errors return the standard JSON shape and log with request context.
- Tests added or updated for logic, parsing, and UI behavior.

## Story Workflow
- Review the story to ensure it is granular enough and does not need to be decomposed into smaller stories.
- Review the story for completeness; resolve any clarifications before continuing.
- Capture clarifications in an "Assumptions/Questions" section in the story when needed.
- Once a story is ready to begin, create a test-first plan and append the planning steps to a "Plan" section in the story.
- Use checkbox format for plan steps (e.g., `- [ ] Step description`).
- As each step is completed, verify it (tests run, manual checks, or both) and update the story accordingly.
- Append any additional development or testing notes to a "Notes" section in the story.
- Mark completion in a "Done" section when all steps are verified.
