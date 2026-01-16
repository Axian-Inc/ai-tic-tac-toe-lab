# Response
I tried an `InvokeModel` call to enable Bedrock and got a hard blocker:

`AccessDeniedException`: missing AWS Marketplace permissions to subscribe to `anthropic.claude-3-haiku-20240307-v1:0` (`aws-marketplace:ViewSubscriptions`, `aws-marketplace:Subscribe`). That means an account/admin with Marketplace permissions must invoke/subscribe once before this model can be used.

What to do next
1. Use an IAM principal with AWS Marketplace permissions to invoke the model once (or subscribe in Marketplace).
2. Wait ~5 minutes after subscription completes.
3. Retry `/v1/move` or `InvokeModel` again.

If you want, I can rerun the `InvokeModel` command and the full-game backend test once you confirm Marketplace access is in place.
