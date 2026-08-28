# ADR-007: Phase 1 static hosting retention and routing

- Status: accepted for Phase 1 implementation
- Date: 2026-08-27
- Owners: coordinator and documentation/delivery
- Related tickets: PH1-003

## Context

Phase 1 needs a low-cost AWS deployment for a Vite single-page application.
The origin must not be public, deep links must return the application shell,
and L&D teardown must balance recoverability against abandoned-resource cost.

## Decision

Store built assets in a private, versioned, SSE-S3 encrypted bucket with every
public-access block enabled and TLS required. CloudFront reads the bucket only
through Origin Access Control (OAC) using SigV4 and a distribution-scoped
bucket policy. Viewers are redirected to HTTPS with TLS 1.2 (2021 policy),
HTTP/2 and HTTP/3, managed security response headers, compression, and the
lowest-cost CloudFront geography (`PriceClass_100`).

CloudFront maps origin 403 and 404 responses to `/index.html` with HTTP 200 and
zero error-cache TTL so client-side routes load. Assets use a five-minute
origin cache-control value and each deployment invalidates `/*`, prioritizing
predictable lab releases over maximum cache efficiency.

`RETAIN_DATA=true` is the default. It retains the versioned asset bucket if the
stack is deleted accidentally. An explicitly approved ephemeral L&D deployment
may set `RETAIN_DATA=false`, which adds automatic object/version deletion and
uses a destroy removal policy. A retention-mode change and any teardown require
account/region confirmation and human approval.

## Alternatives considered

- Public S3 website hosting: cannot use OAC and exposes the origin directly.
- Legacy CloudFront Origin Access Identity: supported but superseded by OAC and
  its SigV4 model.
- S3 redirect/error website behavior: requires the public website endpoint and
  conflicts with the private-origin requirement.
- Default destructive cleanup: reduces orphan cost but creates unnecessary
  loss risk when an operator targets the wrong stack.

## Consequences

- Clients have one HTTPS entry point and cannot bypass CloudFront to S3.
- CloudFormation uses deployment custom resources to upload, prune, and
  invalidate assets.
- Retained buckets continue to incur small storage/request costs and require a
  separately authorized cleanup decision.
- Mapping all 403/404 responses to the SPA can hide missing asset errors behind
  `index.html`; post-deploy verification must request both the root and a known
  client-side route, and browser diagnostics should catch bad asset references.
