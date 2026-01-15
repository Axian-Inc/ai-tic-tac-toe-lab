# Response
Proposed next step: proceed with Story 004, integrate the Bedrock AI move service with prompt profiles.

Why this is next:
- Dependencies are satisfied (Story 002 rules, Story 003 API, Story 011 schemas are done).
- It unlocks downstream stories (Story 005 web UI, Story 006 CLI, Story 007 tests) that all depend on AI integration.
- It aligns with the epic’s core requirement: a playable AI-backed experience with validated AI output and retries.

Dependencies/considerations:
- Ensure strict JSON response enforcement, retry logic, and timeout handling per Story 004 acceptance criteria.
- Implement at least three opponent profiles and deterministic must-do test fixtures for each.
- Avoid logging full AI responses; only redacted summaries.

Is this the correct step to work on next?
