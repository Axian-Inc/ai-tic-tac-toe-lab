# Devcontainer Setup Plan

1. Add a VS Code devcontainer configuration and Dockerfile that installs Node.js, Codex CLI, and AWS CLI v2.
2. Add a Codex auth copy script and hook it into post-create so auth.json is copied from the host mount when available.
3. Capture the request/response in chat-history for traceability.
