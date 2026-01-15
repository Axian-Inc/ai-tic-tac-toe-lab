# Response
Fixed a definite render issue by keeping the data-model diagram to a single Mermaid type and encoding flow via ER relationships in `docs/diagrams/data-model.mmd`.

Details:
- `docs/diagrams/data-model.mmd` now uses only `erDiagram` (Mermaid can’t parse multiple diagram types in one file); the flow is represented via entities for API layer/services/Bedrock with relationship labels.

I still need which other diagrams are failing and what renderer/version you’re using. For example, `docs/diagrams/architecture-overview.mmd` is C4 (unsupported in GitHub/older Mermaid), and `docs/diagrams/api-integration.mmd` uses `rect` blocks that some renderers reject. Share the error text or target renderer and I’ll normalize accordingly.

Notes:
- No tests run.

Next steps:
1. Tell me the renderer/version and the specific files/errors.
2. I can convert the C4 diagram to a flowchart fallback or simplify the sequence diagram if needed.
