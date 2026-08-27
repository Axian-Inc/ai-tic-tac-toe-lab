# Phase 1 CDK Application

This workspace defines private S3 and CloudFront OAC hosting for the built Vite
application. Use root commands so build order remains consistent:

```bash
npm ci
npm run build
npm run test:unit --workspace @tic-tac-toe/infra
npm run infra:synth
```

Synthesis is offline with respect to AWS and defaults to environment `lnd`,
region `us-west-2`, retained data, and `apps/web/dist`. See the
[Phase 1 AWS runbook](../../docs/operations/phase-1-aws-static-hosting.md) for
configuration, security, deployment gates, verification, rollback, teardown,
and cost guidance.

Do not invoke `npm run infra:deploy` without explicit named account/region
approval. The script refuses to run unless both deployment guards are true and
the STS account matches `AWS_ACCOUNT_ID`.
