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

## Implementation Notes
Date: 2026-02-09
- Terraform baseline lives in `infra/terraform`.
- Provides S3 (private) + CloudFront (OAC) with a placeholder `index.html`.
- Outputs CloudFront URL and distribution ID for validation/invalidation workflows.

Date: 2026-02-16
- Terraform CLI is installed (`terraform v1.14.5`) in local dev environment.
- `terraform init` succeeds; `terraform plan` requires configured AWS credentials/profile in the active shell (for example, via `aws login` or exported profile credentials).
- After credentials were configured, `terraform plan` and `terraform apply` completed successfully.
- Active baseline outputs:
  - `bucket_name`: `ttt-static-6e555da9`
  - `cloudfront_distribution_id`: `EGW5O3MVJM73U`
  - `cloudfront_url`: `https://dh0s8gqynjyz6.cloudfront.net`
- Validation evidence:
  - CloudFront URL returns HTTP 200 with placeholder `index.html` content.
  - Direct S3 object URL access returns HTTP 403.

Date: 2026-02-16
- Added local deploy script at `scripts/deploy-static.ps1` for Phase 1 manual deployment workflow.
- Script behavior:
  - Runs build command (`npm run build` by default) unless `-SkipBuild` is supplied.
  - Resolves `bucket_name`, `cloudfront_distribution_id`, and `cloudfront_url` from Terraform outputs unless explicitly provided.
  - Uploads artifacts with `aws s3 sync <build-dir> s3://<bucket> --delete`.
  - Invalidates CloudFront with `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"` (skipped in `-DryRun` mode).
- Updated `README.md` with a full manual deploy runbook, optional arguments, and verification command.
- Local validation evidence:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1 -SkipBuild -BuildDir infra/terraform -DryRun` succeeded.
  - Dry run resolved Terraform outputs and executed AWS CLI sync plan without performing invalidation.

Date: 2026-02-16
- Executed live deployment verification run using updated static artifact:
  - Command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1 -SkipBuild -BuildDir dist`
  - S3 sync uploaded updated `index.html` to bucket `ttt-static-6e555da9`.
  - CloudFront invalidation created: `IB48WLL21JGMZE9VZJ2IBJ5P33` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl` check against `https://dh0s8gqynjyz6.cloudfront.net` returned updated marker text:
    - `Verification update: deployed on 2026-02-16 14:22 PT.`
- Repository baseline alignment:
  - Updated Terraform placeholder HTML in `infra/terraform/main.tf` to include `Manual deployment pipeline verification complete.`

Date: 2026-03-13
- Deployed the `TTT-16` landing-screen update with the standard script:
  - Command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1`
  - Build completed successfully and uploaded the current `dist/` artifacts to bucket `ttt-static-6e555da9`.
  - CloudFront invalidation created: `IBXY9RLYEOJ7KRYJSF7AZ23H3Z` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl.exe -I https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/1.1 200 OK`.
  - Response headers showed `Last-Modified: Fri, 13 Mar 2026 15:37:01 GMT`.

Date: 2026-03-13
- Deployed the `TTT-17` board/status update with the standard script:
  - Command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1`
  - Build completed successfully and uploaded the current `dist/` artifacts to bucket `ttt-static-6e555da9`.
  - CloudFront invalidation created: `IEKQGCSCIHWNJJGLT3YLOD27M5` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl.exe -I https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/1.1 200 OK`.
  - Response headers showed `Last-Modified: Fri, 13 Mar 2026 15:57:19 GMT`.

Date: 2026-03-13
- Deployed the `TTT-18` legal-move feedback update with the standard script:
  - Command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1`
  - Build completed successfully and uploaded the current `dist/` artifacts to bucket `ttt-static-6e555da9`.
  - CloudFront invalidation created: `IAJVTA1MHLTKO384A4CNJW2M3H` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl.exe -I https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/1.1 200 OK`.
  - Response headers showed `Last-Modified: Fri, 13 Mar 2026 16:14:01 GMT`.

Date: 2026-03-13
- Deployed the `TTT-19` quit/rematch update with the standard script:
  - Command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1`
  - Build completed successfully and uploaded the current `dist/` artifacts to bucket `ttt-static-6e555da9`.
  - CloudFront invalidation created: `IDIKUJVUUKM45H2UUIJLNWN0O3` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl.exe -I https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/1.1 200 OK`.
  - Response headers showed `Last-Modified: Fri, 13 Mar 2026 16:27:40 GMT`.

Date: 2026-03-17
- Deployed the `TTT-20` game-module regression fix with the manual equivalent of the standard script because PowerShell was unavailable in the current Linux environment:
  - Build command: `npm run build`
  - Artifact upload command: `aws s3 sync dist s3://ttt-static-6e555da9 --delete`
  - CloudFront invalidation command: `aws cloudfront create-invalidation --distribution-id EGW5O3MVJM73U --paths '/*'`
  - CloudFront invalidation created: `IC5N8DZFX17IWUW2VIG870488A` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl -I https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/2 200`.
  - Response headers showed `Last-Modified: Tue, 17 Mar 2026 16:42:51 GMT`.

Date: 2026-03-17
- Deployed the `TTT-75` Playwright selector fix with the manual equivalent of the standard script because PowerShell was unavailable in the current Linux environment:
  - Build command: `npm run build`
  - Artifact upload command: `aws s3 sync dist s3://ttt-static-6e555da9 --delete`
  - CloudFront invalidation command: `aws cloudfront create-invalidation --distribution-id EGW5O3MVJM73U --paths '/*'`
  - CloudFront invalidation created: `I7O5ABFVF1AZNI8A8NSNCDDG77` for distribution `EGW5O3MVJM73U`.
- Verification:
  - `curl -I https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/2 200`.
  - Response headers showed `Last-Modified: Tue, 17 Mar 2026 17:30:24 GMT`.
