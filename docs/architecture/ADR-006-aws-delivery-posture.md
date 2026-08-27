# ADR-006: Gate AWS delivery with OIDC and environment approval

- Status: accepted by orchestration plan
- Date: 2026-08-26
- Owners: coordinator and documentation/delivery
- Related tickets: FND-002, PH1-003, PH2-004, PH3-003

## Context

Every integration merge must trigger CI/CD, but validation must not imply
unreviewed mutation of the Axian L&D account. Long-lived access keys increase
exposure, and a forked or untrusted PR must never receive deployment authority.

## Decision

PR and push validation use read-only GitHub permissions and do not access AWS.
After successful validation of a `zebanaya-kepler` push, delivery is eligible
only when `ENABLE_AWS_DEPLOYMENT` is explicitly true and the protected
`axian-lnd` environment approves it. GitHub OIDC assumes a scoped AWS role.
Deployment checks out the exact validated SHA. Account IDs and role ARNs stay
in environment/repository configuration, never source.

## Alternatives considered

- Repository access-key secrets: functional but long-lived and harder to
  constrain or rotate.
- Deploy from PR validation: exposes shared infrastructure to unaccepted code.
- Always deploy integration pushes: removes the requested approval boundary.

## Consequences

- A repository and AWS administrator must configure OIDC trust, variables,
  protection, and approvers.
- A push always runs CI; CD may intentionally report skipped until enabled.
- The role policy, CDK stacks, logs, and approval history provide an audit path.
