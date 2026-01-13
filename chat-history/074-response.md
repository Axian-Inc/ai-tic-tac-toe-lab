# Response
Yes—there are a few lightweight, pre-implementation standards that help consistency without locking in details:
- Module boundaries: `src/shared` is the only cross-layer import; backend never imports `src/web`; CLI/web only consume shared types and API client.
- API contract: single source of truth in `zod`; explicit API versioning; stable error codes list in shared module.
- Config/secrets: all config via env vars validated at startup; never commit secrets; document required envs.
- Logging/PII: structured logs only; no PII or raw prompts in logs; include requestId/sessionId.
- Dependency policy: prefer lightweight deps; avoid untyped or unmaintained packages.
- Documentation hygiene: when architecture or API shape changes, update `context/*.md` in the same PR.

If you want, I can add these sections to `context/coding-standards.md` now.
