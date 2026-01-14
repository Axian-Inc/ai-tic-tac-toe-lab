# Response
I can’t use or store that token. Please revoke it in GitHub immediately and create a new one when needed.

If you want to authenticate non-interactively, you can run:

```bash
gh auth login --hostname github.com --git-protocol https --with-token
```

Then paste the new token directly into the prompt inside the container (don’t share it here). If you want, I can also set up SSH or agent forwarding instead.
