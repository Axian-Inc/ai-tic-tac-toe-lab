# Response
For a simple, least‑cost AWS setup, I recommend Lambda for the API and Bedrock access, with either a Function URL (cheapest/simplest) or API Gateway HTTP API (still low cost, more features). Here’s the short comparison:

- Lambda + Function URL: lowest cost and fastest to ship; no extra gateway charges, just Lambda invocations. You handle routing (`/v1/move`, `/v1/new-game`) inside the app; CORS can be handled in responses. Good fit for a POC with no auth.
- Lambda + API Gateway HTTP API: slightly more cost but still cheap; gives you native routing, CORS config, throttling, and easier custom domain. Good if you want cleaner API management now.
- ECS Fargate: simple container deploy but higher baseline cost even when idle. Overkill for a small, low‑traffic POC.
- EC2: not worth the ops overhead for this use case.

If “least cost and simplest” is the priority, I’d pick Lambda + Function URL. If you want a bit more structure (routes, custom domain, managed CORS), pick API Gateway HTTP API.

Tell me which you want and I’ll update `context/tech-stack.md` and proceed.
