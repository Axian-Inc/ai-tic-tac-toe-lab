# Response
If the browser/device flow is blocked in the container, use one of these:

Option A: Paste a PAT into gh
```bash
gh auth login --hostname github.com --git-protocol https --with-token
```
Then paste a GitHub Personal Access Token (classic or fine-grained with repo access).

Option B: SSH via agent forwarding
- Add your SSH key to GitHub on the host.
- Ensure agent forwarding into the devcontainer (VS Code setting).
- Switch remote to SSH: `git remote set-url origin git@github.com:criddle-axian/ai-tic-tack-toe.git`.

Option C: Authenticate on host, then copy into container
- Run `gh auth login` on the host.
- Copy `~/.config/gh` into the container or bind-mount it.

Tell me which option you want and I’ll give exact steps for your setup.
