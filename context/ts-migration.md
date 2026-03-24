# TypeScript Deployment Script Migration

Last updated: 2026-03-23

## Purpose
- Track the planned migration of AWS deployment scripts from Bash to TypeScript while preserving the current npm command surface and deployment behavior.

## Scope
- Convert the AWS deployment scripts under `scripts/aws/` to TypeScript.
- Keep `infra/dev.yaml` as the deployment source of truth.
- Keep the existing npm command names unchanged.
- Preserve the current low-cost AWS deployment model and frontend/backend separation.

## Checklist

### Preparation
- [x] Confirm the migration remains implementation-only and does not change the documented Phase 2 deployment architecture.
- [x] Keep `infra/dev.yaml` as the only required deployment configuration source.
- [x] Keep these npm command names unchanged:
  - [x] `npm run aws:s3:setup`
  - [x] `npm run aws:s3:deploy`
  - [x] `npm run aws:backend:setup`
  - [x] `npm run aws:backend:deploy`
- [x] Add the minimum TypeScript runtime support needed to execute script files from npm.
- [x] Add a YAML parsing approach suitable for `infra/dev.yaml` and simpler to maintain than the current shell parsing.

### Shared TypeScript Foundation
- [x] Create a shared TypeScript helper layer for AWS deployment scripts.
- [x] Port config loading from `scripts/aws/common.sh`.
- [x] Port required config validation from `scripts/aws/common.sh`.
- [x] Port optional config lookup from `scripts/aws/common.sh`.
- [x] Port project-tagged naming validation from `scripts/aws/common.sh`.
- [x] Port file existence checks from `scripts/aws/common.sh`.
- [x] Port command availability checks from `scripts/aws/common.sh`.
- [x] Port CloudFormation stack output resolution from `scripts/aws/common.sh`.
- [x] Port default VPC lookup from `scripts/aws/common.sh`.
- [x] Port default subnet lookup from `scripts/aws/common.sh`.
- [x] Standardize command execution and stderr handling for AWS CLI and npm invocations.

### Script-by-Script Migration
- [x] Replace `scripts/aws/setup-s3-website.sh` with a TypeScript implementation that preserves:
  - [x] stack deployment via CloudFormation
  - [x] project tag guardrails
  - [x] website URL output
- [x] Replace `scripts/aws/deploy-s3-website.sh` with a TypeScript implementation that preserves:
  - [x] optional multiplayer API base URL resolution from stack output
  - [x] frontend build via `npm run build`
  - [x] `VITE_MULTIPLAYER_API_BASE_URL` injection behavior
  - [x] S3 sync with delete semantics
  - [x] final bucket and website URL output
- [x] Replace `scripts/aws/setup-multiplayer-service.sh` with a TypeScript implementation that preserves:
  - [x] default VPC and subnet lookup
  - [x] CloudFormation deploy with IAM capability
  - [x] deployment bucket and backend URL output
- [x] Replace `scripts/aws/deploy-multiplayer-service.sh` with a TypeScript implementation that preserves:
  - [x] release ID generation
  - [x] backend build via `npm run server:build`
  - [x] temporary staging and archive creation
  - [x] S3 upload of the release bundle
  - [x] Systems Manager command dispatch
  - [x] wait and failure reporting flow
  - [x] backend health verification

### High-Risk Migration Areas
- [x] Preserve `infra/dev.yaml` parsing semantics for all currently used keys.
- [x] Preserve current command outputs closely enough for operator use and documentation consistency.
- [x] Preserve rerun behavior documented in `context/deployment.md`.
- [x] Recreate the backend SSM parameters payload as structured JSON instead of shell-generated inline text.
- [x] Verify temporary file cleanup behavior for backend deploy staging artifacts.
- [x] Avoid changing deployment semantics while refactoring shell implementation details.

### npm Integration
- [x] Update `package.json` to run the TypeScript deployment scripts through npm.
- [x] Remove Bash-based npm entries only after the TypeScript replacements are in place.
- [x] Ensure the new npm commands still work from the repo root with no extra CLI flags beyond current documented behavior.

### Verification
- [x] Run `npm run typecheck`.
- [x] Add tests for deployment config parsing.
- [x] Add tests for generated AWS CLI argument construction where practical.
- [x] Add tests for backend SSM payload generation.
- [x] Verify the TypeScript scripts preserve current environment variable handling such as `RELEASE_ID` and `VITE_MULTIPLAYER_API_BASE_URL`.
- [x] Verify the migrated scripts still support the documented independent frontend and backend deployment paths.

### Documentation Updates
- [x] Update `context/deployment.md` after the migration lands to describe TypeScript-based deployment scripts.
- [x] Update `context/tech-stack.md` if a new runtime dependency is added for script execution.
- [x] Update `infra/README.md` if command examples or implementation notes need to reference TypeScript scripts instead of Bash files.
- [x] Update any remaining references in `README.md` or other docs that point directly to the old shell implementation.

### Done Criteria
- [x] All four AWS deployment workflows run through npm using TypeScript-backed implementations.
- [x] `infra/dev.yaml` remains the deployment source of truth.
- [x] Frontend and backend deployment flows remain independently deployable.
- [x] The low-cost AWS Phase 2 architecture remains unchanged.
- [x] Context documentation reflects the migration accurately.
