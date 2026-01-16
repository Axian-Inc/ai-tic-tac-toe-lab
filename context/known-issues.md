# Known Issues

## Active
- Starting player `O` is selectable in the UI/CLI, but game-rule validation enforces `X` as the first move (may lead to `INVALID_MOVE` on the first turn).

## Resolved
- Tech stack doc references pnpm workspaces, but repo uses npm (`package-lock.json`) with no pnpm config.
- Infra/IaC directory referenced in context is not present; deployment appears undocumented in code.
- Bedrock `anthropic.claude-3-haiku-20240307-v1:0` required Marketplace subscription; switched to `us.anthropic.claude-3-5-haiku-20241022-v1:0` inference profile to avoid the block.
