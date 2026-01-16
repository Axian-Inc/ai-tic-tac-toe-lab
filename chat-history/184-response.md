# Response
Deployment retried successfully after bootstrapping and fixing Function URL CORS. Web UI built and uploaded; API smoke test passed.

- Ran `npx cdk bootstrap aws://590316689173/us-west-2` to update the CDK bootstrap stack (required by API deploy).
- Updated `infra/lib/api-stack.ts` to remove `OPTIONS` from Function URL CORS allowMethods.
- Deployed stacks:
  - API Function URL: `https://spvcmkna5zqhdjwmiv7ultgg3q0yodfk.lambda-url.us-west-2.on.aws/`
  - Web bucket: `tictactoeweb-dev-webbucket12880f5b-jptkrqx161rp`
  - Web URL: `http://tictactoeweb-dev-webbucket12880f5b-jptkrqx161rp.s3-website-us-west-2.amazonaws.com`
- Built and uploaded web UI with `VITE_API_BASE_URL` pointing at the Function URL.
- Smoke test: `POST /v1/new-game` returned HTTP 200 with valid GameState JSON.
