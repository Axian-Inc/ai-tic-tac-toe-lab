# Infrastructure Agent Instructions

These instructions apply below `infra/`. The documentation/delivery agent owns
this area, and the repository root `AGENTS.md` also applies.

## Target

- Use AWS CDK in TypeScript.
- Phase 1 hosts the built web app in private S3 behind CloudFront.
- Phases 2 and 3 add API Gateway HTTP/WebSocket APIs, .NET 8 Lambda handlers,
  DynamoDB persistence, least-privilege IAM, logs, alarms, and useful outputs.
- Optimize for the low-volume L&D workload and avoid continuously running
  compute unless an ADR justifies it.

## Safety and Reproducibility

- `npm run infra:synth` must require no live AWS mutation.
- Parameterize account, region, environment name, retention, and allowed web
  origins. Default documentation to `us-west-2` as specified by the starter.
- Never hardcode account IDs, credentials, secrets, or personal resource names.
- Add tags, encryption, CloudFront HTTPS redirect, API throttles, log retention,
  and removal policies appropriate to an L&D environment.
- Separate synth from deploy. Deployment, teardown, or changes to an AWS
  account require explicit approval and a confirmed account/region.
- Document bootstrap, deploy, verification, rollback, teardown, and estimated
  cost drivers.

## Verification

Add CDK assertions for important resources, permissions, and configuration.
Handoffs must include a clean synth result and the generated change summary;
do not commit `cdk.out`.

