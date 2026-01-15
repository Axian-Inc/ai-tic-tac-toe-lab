# Known Issues

## Active
- Tech stack doc references pnpm workspaces, but repo uses npm (`package-lock.json`) with no pnpm config.
- Infra/IaC directory referenced in context is not present; deployment appears undocumented in code.
- Starting player `O` is selectable in the UI/CLI, but game-rule validation enforces `X` as the first move (may lead to `INVALID_MOVE` on the first turn).

## Resolved
- 
