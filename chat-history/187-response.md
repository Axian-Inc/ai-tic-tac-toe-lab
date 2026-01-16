# Response
I can’t enable AWS Bedrock on your account directly from here, but here’s the minimal checklist to do it and grant this Lambda access:

1. In the AWS Console, go to Bedrock → Model access → “Request model access” and enable `anthropic.claude-3-haiku-20240307-v1:0` (or the model you want).
2. Wait for access to be granted (status will show “Access granted”).
3. Confirm your AWS CLI profile/role has permission to call Bedrock:
   - `bedrock:InvokeModel` for the selected model.
4. Re-deploy the API stack if needed so the Lambda role gets the updated permission (it already includes `bedrock:InvokeModel`, but model access must be enabled on the account).
5. Re-test `/v1/move` to verify AI responses work.

If you want, I can run the re-test loop once Bedrock access is enabled.
