# Response
Created `.devcontainer/copy-codex-prompts.sh` to copy `.codex/prompts` into `~/.codex/prompts`, with a directory check, `mkdir -p`, and a recursive copy. It also supports `SOURCE_DIR` and `DEST_DIR` overrides if you want to point at different locations.

Next step if you want to run it:
1) `.devcontainer/copy-codex-prompts.sh`
