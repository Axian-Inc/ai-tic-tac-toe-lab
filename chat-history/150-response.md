# Response
Added `copy-codex-prompts` to the devcontainer image setup and wired a conditional run during the Dockerfile build so it copies prompts when `/tmp/host-codex/prompts` is available, then lands them in `/root/.codex/prompts`.

Details:
- Added script install + chmod + conditional execution in `.devcontainer/Dockerfile`.

Next steps:
1) Rebuild the devcontainer so the Dockerfile change takes effect.
2) If you want it to always run after the workspace is mounted, I can also add `copy-codex-prompts` to `postCreateCommand`.
