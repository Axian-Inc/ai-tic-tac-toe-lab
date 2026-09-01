# Tic-Tac-Toe CDK application

This workspace defines two independently deployable stacks:

- private S3 and CloudFront OAC hosting for the built Vite application; and
- the Phase 2 API Gateway HTTP/WebSocket, .NET 10 Lambda, DynamoDB, logging,
  alarm, and IAM backend.

Use root commands so build order remains consistent:

```bash
npm ci
npm run build
npm run test:unit --workspace @tic-tac-toe/infra
npm run infra:synth
```

Synthesis is offline with respect to AWS and defaults to environment `lnd`,
region `us-west-2`, retained data, 14-day backend logs, localhost CORS,
`apps/web/dist`, and a synthesis-only Lambda fixture. The guarded deployment
script rejects the fixture and placeholder handlers.

See the [Phase 1 static-hosting
runbook](../../docs/operations/phase-1-aws-static-hosting.md) and [Phase 2
backend runbook](../../docs/operations/phase-2-aws-backend.md) for
configuration, access patterns, security, deployment gates, verification,
rollback, recovery, teardown, and cost guidance.

Do not invoke `npm run infra:deploy` without explicit named account/region
approval. The script refuses to run unless both deployment guards are true,
the STS account matches `AWS_ACCOUNT_ID`, real .NET handler/artifact seams are
provided, configured origins are explicit, and exact client `VITE_` variable
names are supplied. It deploys the backend first, rebuilds the client from API
outputs, and then deploys the web stack.
