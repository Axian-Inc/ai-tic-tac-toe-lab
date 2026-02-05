# Deployment (Draft)
Date: 2026-02-05

## Requirement
- IaC and deployment to Axian’s LnD AWS account.

## Decisions
- IaC tooling: Terraform.
- AWS hosting: S3 + CloudFront for static hosting.
- Single environment only (no dev/stage/prod split).
- Use existing AWS profile for access (to be set up).

## Open Questions
