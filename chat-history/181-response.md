# Response
Proposed next step: start `stories/story-008.md` (Provision POC infrastructure and deployment steps).

Why this is next
- It is the only remaining story outside `stories/done/` and the epic milestone still missing is deployable infra.
- Dependencies are satisfied: Story 003 (API) and Story 005 (web UI) are completed in `stories/done/`.

Dependencies/considerations
- `infra/` does not exist (noted in `context/known-issues.md`), so we’ll need to decide whether to create it and add CDK setup from scratch.
- `context/tech-stack.md` references pnpm, but the repo uses npm; we should confirm which package manager to use for CDK commands/docs.
- We will need to add env var defaults and deployment steps to `context/` per the Definition of Done.

Is this the correct step to work on next?
