# Response

Review complete. Each story is directionally solid but most are missing explicit inputs/outputs and test hooks. Below are per-story gaps and suggested concrete additions.

Story 001 (`stories/story-001.md`)
- Missing explicit inputs/outputs: define schema names and exact fields with types, e.g., `GameState`, `MoveRequest`, `MoveResponse`, `ErrorResponse` and required/optional fields.
- Testability: add sample valid/invalid payloads and the exact validation expectations (e.g., invalid when board length != 9, invalid when winner set but status != win).
- Acceptance criteria should state outputs: schema exports + generated TS types + examples in docs/tests.

Story 002 (`stories/story-002.md`)
- Inputs/outputs unclear: specify function signatures (e.g., `applyMove(state, move) -> {state|error}` and `computeStatus(state) -> status`).
- Define structured error shape (errorCode list) to align with API.
- Testability: add deterministic examples with explicit input boards and expected outputs.

Story 003 (`stories/story-003.md`)
- Inputs/outputs incomplete: define request/response bodies for `/v1/new-game` and `/v1/move` (fields, required/optional, example payloads).
- Acceptance criteria should include status codes (200/4xx), errorCode list, and response shape.
- Testability: specify unit tests for handler behavior with concrete inputs (invalid move, terminal state, missing fields).

Story 004 (`stories/story-004.md`)
- Inputs/outputs: specify AI prompt input fields and exact JSON response schema (e.g., `{"moveIndex": number, "rationale": string}`) and validation rules.
- “Retry” criteria needs hard numbers (max retries, timeout, backoff behavior).
- Testability: define the deterministic scenarios (board states and required moves) per profile.

Story 005 (`stories/story-005.md`)
- Inputs/outputs: define UI states and actions (start game inputs, move input, API calls, rendered outputs).
- Acceptance criteria should name specific UI outputs for win/draw/error states.
- Testability: add explicit UI test cases with sample board state and expected rendering.

Story 006 (`stories/story-006.md`)
- Inputs/outputs: specify CLI commands/options, prompts, and output format.
- Acceptance criteria should include a sample CLI flow and exact error output format.
- Testability: define testable outputs for sample inputs (mock API responses).

Story 007 (`stories/story-007.md`)
- Inputs/outputs: specify test fixtures (board + nextPlayer + expected status/move).
- Acceptance criteria should include exact counts (e.g., 4 rule tests, 3 invalid parsing tests, 3 scenarios/profile).
- Testability is good but should tie to filenames or test suite names.

Story 008 (`stories/story-008.md`)
- Inputs/outputs: define CDK stack outputs (Function URL, bucket name) and documented env vars.
- Acceptance criteria should include explicit success criteria for deploy commands and smoke test inputs/outputs.
- Testability: add a minimal smoke test procedure with expected responses.

If you want, I can update each story with explicit inputs/outputs and concrete acceptance criteria.
