Set up a VS Code devcontainer that installs Node.js 20, Codex CLI, and AWS CLI v2, plus a post-create auth copy script wired to a host mount of your ~/.codex folder. Added the requested plan file and recorded this exchange in chat-history.

- .devcontainer/Dockerfile installs Node.js, @openai/codex, and AWS CLI v2.
- .devcontainer/devcontainer.json mounts ${localEnv:USERPROFILE}/.codex to /tmp/host-codex and runs copy-codex-auth on create.
- .devcontainer/copy-codex-auth.sh copies auth.json into ~/.codex with 600 perms if present.
- planning/setup-devcontainer-plan.md contains the plan.
- chat-history/001-prompt.md and chat-history/001-response.md capture the prompt/response.

Note: If you open this on macOS or Linux, update the mount path in .devcontainer/devcontainer.json from ${localEnv:USERPROFILE} to ${localEnv:HOME}.

Next steps:
1) Reopen in container to build the image.
2) In the container, run `codex --version` and `aws --version` to verify installs.
