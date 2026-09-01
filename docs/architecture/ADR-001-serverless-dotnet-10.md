# ADR-001: Serverless .NET 10 multiplayer backend

- Status: accepted by orchestration plan
- Date: 2026-08-26
- Owners: coordinator, application, documentation/delivery
- Related tickets: FND-002, PH2-001, PH2-004

## Context

Phase 2 needs a preferred C# backend, HTTP and WebSocket communication,
ordered persistence, and low-cost AWS hosting for an L&D workload. Keeping
continuously running compute would add idle cost and operational work.

## Decision

Target .NET 10 Lambda application services behind API Gateway HTTP and
WebSocket APIs, with DynamoDB persistence. Phase 1 static assets use private S3
behind CloudFront. CDK in TypeScript defines all resources. Exact HTTP routes,
event schemas, and game vocabulary are frozen in the Phase 2 contract
documents under `contracts/`.

## Alternatives considered

- ASP.NET Core in ECS/Fargate: familiar hosting, but incurs continuous or
  minimum capacity and more operational surface.
- Node.js Lambda backend: aligns with the client toolchain but does not honor
  the preferred C# backend.
- EC2: flexible, but excessive patching, availability, and idle-cost burden.

## Consequences

- Cost follows requests and stored data at the expected low volume.
- API Gateway WebSocket connection lifecycle and Lambda cold starts must be
  designed and tested.
- .NET 10 tooling is required locally and in CI.
- Infrastructure needs least-privilege roles, logs, alarms, retention, and
  explicit account/region parameters.
