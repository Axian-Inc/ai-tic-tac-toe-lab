# Response
Best options in a devcontainer (pick one):

1) GitHub CLI OAuth (simplest)
- Install `gh` in the container (if not already).
- Run `gh auth login` and choose HTTPS; it stores a token in the container keychain.
- Git uses the token automatically; no manual PAT handling.

2) SSH with agent forwarding (cleanest for long-term)
- Generate an SSH key on the host and add it to GitHub.
- Forward your SSH agent into the devcontainer (VS Code devcontainers supports this).
- Set remote to `git@github.com:criddle-axian/ai-tic-tack-toe.git`.

3) PAT + credential helper (works everywhere)
- Create a Personal Access Token on GitHub.
- Use `git config --global credential.helper store` (or `cache`) inside the container.
- First push prompts for the token and stores it.

If you want, tell me which path you prefer and I can set it up step-by-step.
