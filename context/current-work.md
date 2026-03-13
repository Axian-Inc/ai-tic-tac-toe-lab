# Current Work
Date: 2026-03-13

## Purpose
Track the single active Jira ticket and execution state so work is visible and uninterrupted.

## Active Ticket
- Key: TTT-16
- Summary: Landing screen with Play vs CPU and mark selection
- Status: IN QA

## Plan
1. Await QA validation for `TTT-16`.
2. If QA passes, transition `TTT-16` from `IN QA` to `In Review`.
3. Keep `TTT-14` under observation for its separate QA follow-up.

## Progress Log
- 2026-02-16: Initialized tracking template.
- 2026-02-16 13:14 - Reviewed all `context/` docs per AGENTS.md, fetched Jira story `TTT-11`, and assessed current Terraform implementation/state.
- 2026-02-16 13:14 - Confirmed implementation mostly exists in `infra/terraform`; previous apply appears to have failed at CloudFront OAC permission boundary.
- 2026-02-16 13:14 - Replaced placeholder tracking with an execution plan to complete TTT-11.
- 2026-02-16 13:15 - Transitioned Jira ticket `TTT-11` from `Groomed` to `In Progress` to match active execution.
- 2026-02-16 13:16 - Attempted Terraform execution (`terraform init`) in `infra/terraform`; failed because Terraform CLI is not installed or not on PATH in current environment.
- 2026-02-16 13:33 - Confirmed Terraform is now installed (`terraform v1.14.5`) and successfully re-ran `terraform init` in `infra/terraform`.
- 2026-02-16 13:33 - Attempted `terraform plan -out plan.tfplan`; failed at AWS provider initialization due to missing credentials (`No valid credential sources found`).
- 2026-02-16 13:41 - Verified AWS credentials are now configured (`aws sts get-caller-identity` succeeded for account `590316689173`), then re-ran `terraform plan -out plan.tfplan` successfully.
- 2026-02-16 13:43 - Ran `terraform apply -auto-approve plan.tfplan`; created CloudFront OAC, CloudFront distribution, and S3 bucket policy successfully.
- 2026-02-16 13:43 - Validated acceptance checks:
  - `curl -i https://dh0s8gqynjyz6.cloudfront.net` returned HTTP 200.
  - Response body includes placeholder content (`TTT placeholder page`).
  - `curl -i https://ttt-static-6e555da9.s3.amazonaws.com/index.html` returned HTTP 403 (direct S3 access denied).
- 2026-02-16 13:44 - Added completion evidence comment on Jira issue `TTT-11` and transitioned ticket status from `In Progress` to `Done`.
- 2026-02-16 14:08 - Received assignment for `TTT-12`, reviewed all `context/` docs, and fetched Jira acceptance criteria/details.
- 2026-02-16 14:08 - Transitioned Jira ticket `TTT-12` from `Groomed` to `In Progress` and started active implementation tracking.
- 2026-02-16 14:09 - Implemented `scripts/deploy-static.ps1` to automate build, S3 sync, and CloudFront invalidation with Terraform output lookup and optional overrides.
- 2026-02-16 14:09 - Updated `README.md` with documented manual deployment commands, arguments, and verification steps for QA.
- 2026-02-16 14:10 - Validated deploy script with dry-run command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1 -SkipBuild -BuildDir infra/terraform -DryRun`.
- 2026-02-16 14:10 - Updated `context/deployment.md` implementation notes with TTT-12 workflow and verification evidence.
- 2026-02-16 14:11 - Added Jira completion evidence comment on `TTT-12`.
- 2026-02-16 14:11 - Transitioned `TTT-12` through required workflow states: `In Progress` -> `In QA` -> `In Review` -> `Done`.
- 2026-02-16 14:11 - Closed active execution entry and reset tracker to idle state.
- 2026-02-16 14:21 - Reopened `TTT-12` to run a requested end-to-end deploy verification with an updated `index.html`.
- 2026-02-16 14:22 - Created updated `dist/index.html` artifact with verification marker text for deployment validation.
- 2026-02-16 14:22 - Ran live deployment command: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1 -SkipBuild -BuildDir dist`.
- 2026-02-16 14:22 - Deployment succeeded: S3 sync uploaded `index.html`; CloudFront invalidation created (`IB48WLL21JGMZE9VZJ2IBJ5P33`).
- 2026-02-16 14:22 - Verified updated content at CloudFront URL; marker `Verification update: deployed on 2026-02-16 14:22 PT.` found on first check.
- 2026-02-16 14:23 - Updated `infra/terraform/main.tf` placeholder page content to include `Manual deployment pipeline verification complete.` for baseline consistency.
- 2026-02-16 14:23 - Updated `context/deployment.md` with live verification evidence.
- 2026-02-16 14:23 - Added verification evidence comment on Jira issue `TTT-12` and transitioned through `In QA` -> `In Review` -> `Done`.
- 2026-02-16 14:23 - Closed active verification execution and reset tracker to idle state.
- 2026-02-16 14:30 - Started grooming session for `TTT-13` (`Initialize React + TS app with Vite`).
- 2026-02-16 14:30 - Retrieved Jira issue details and completed first readiness scan; identified gaps in scope boundaries, dependencies, risks/unknowns, NFRs, and test specs.
- 2026-02-16 14:34 - Captured stakeholder grooming decisions for story scope, placeholder behavior, Node LTS runtime, repo standards, local-only build/deploy, accessibility baseline, and testing waiver.
- 2026-02-16 14:34 - Rewrote Jira Description using grooming template with explicit in/out scope, Gherkin acceptance criteria, testing specs, and waiver owner.
- 2026-02-16 14:34 - Added Grooming Notes comment to `TTT-13` documenting DoR checklist results (all PASS), decisions, waiver rationale, and follow-up note.
- 2026-02-16 14:34 - Transitioned Jira ticket `TTT-13` from `To Do` to `Groomed` after READY assessment.
- 2026-02-16 14:34 - Closed active grooming entry and reset tracker to idle state.
- 2026-02-27 13:59 - Received implementation assignment for `TTT-13`; reviewed context and Jira acceptance criteria.
- 2026-02-27 14:00 - Transitioned Jira ticket `TTT-13` from `Groomed` to `In Progress`.
- 2026-02-27 14:02 - Implemented Vite + React + TypeScript scaffold files (`package.json`, TS configs, Vite config, `src/` app shell, and `Coming Soon` landing heading).
- 2026-02-27 14:02 - Added repository standards baseline: ESLint flat config, Prettier config, `.gitignore`, npm scripts, and Node LTS engine constraint.
- 2026-02-27 14:03 - Installed dependencies and validated build success with `npm run build` (Vite production artifacts emitted to `dist/`).
- 2026-02-27 14:03 - Resolved ESLint v9 config compatibility by switching to `eslint.config.js`; `npm run lint` now passes.
- 2026-02-27 14:05 - Added completion evidence comment on Jira issue `TTT-13`.
- 2026-02-27 14:05 - Transitioned Jira ticket `TTT-13` from `In Progress` to `IN QA`.
- 2026-02-27 14:08 - Scoped Prettier coverage via `.prettierignore` to avoid unrelated repository formatting churn from historical docs and skill assets.
- 2026-02-27 14:08 - Final validation pass complete: `npm run lint`, `npm run build`, and `npm run format:check` all succeeded.
- 2026-02-27 14:25 - Applied QA follow-up update to `.gitignore` to include missing local-only artifacts (Terraform state/override files, editor/OS artifacts, npm/pnpm/yarn debug logs, and `.env*` with `.env.example` exception).
- 2026-02-27 14:43 - Started next work item selection; reviewed Jira backlog and identified groomed candidates.
- 2026-02-27 14:43 - Transitioned Jira ticket `TTT-5` from `Groomed` to `In Progress` and set it as the single active ticket.
- 2026-02-27 14:45 - `TTT-5` identified as epic-level/QA-tracking only for current need; paused by transitioning back to `Groomed`.
- 2026-02-27 14:45 - Started grooming workflow for `TTT-14` (`Add Tailwind CSS`) and set it as current active execution item.
- 2026-02-27 14:48 - Captured stakeholder grooming decisions: setup-only scope, placeholder examples acceptable, latest stable/LTS-compatible version, minimal plugins, UI automation deferred.
- 2026-02-27 14:48 - Rewrote `TTT-14` Description with structured sections, Gherkin AC, and testing specs including explicit unit-test waiver ownership.
- 2026-02-27 14:48 - Added Grooming Notes comment and transitioned `TTT-14` from `To Do` to `Groomed` (READY).
- 2026-02-27 14:49 - Began implementation for `TTT-14`; transitioned ticket from `Groomed` to `In Progress`.
- 2026-02-27 14:50 - Installed Tailwind baseline packages (`tailwindcss`, `@tailwindcss/vite`) and wired plugin integration in Vite config.
- 2026-02-27 14:50 - Replaced baseline CSS with Tailwind import and updated `src/App.tsx` placeholder to include visibly Tailwind-styled example elements.
- 2026-02-27 14:51 - Updated `README.md` with Tailwind setup notes and validated `npm run lint` + `npm run build`.
- 2026-02-27 14:51 - Ran `npm run format` to resolve one formatting issue in `src/App.tsx`; `npm run format:check` now passes.
- 2026-02-27 14:52 - Added implementation/validation evidence comment on Jira issue `TTT-14`.
- 2026-02-27 14:52 - Transitioned Jira ticket `TTT-14` from `In Progress` to `IN QA`.
- 2026-02-27 14:57 - Started grooming session for `TTT-15` (`Documentation baseline`) and performed initial issue/transition review.
- 2026-02-27 15:00 - Determined `TTT-15` overlaps existing implementation-story documentation updates and is obsolete as a standalone story.
- 2026-02-27 15:00 - Added closure rationale comment to `TTT-15` and transitioned ticket directly from `To Do` to `Done`.
- 2026-03-13 08:09 - Started grooming pass for `TTT-16`; reviewed all `context/` docs, the grooming skill workflow, and source requirements in `docs/Phase_1/phase_1_overview.md` and `docs/Phase_1_Work_Items.md`.
- 2026-03-13 08:09 - Completed initial readiness scan for `TTT-16`; identified missing scope boundaries, landing-to-game handoff behavior, dependency notes, edge cases, and actionable testing guidance.
- 2026-03-13 08:11 - Rewrote `TTT-16` description with explicit in/out scope, dependencies, Gherkin acceptance criteria, and normalized unit/integration/E2E testing specs.
- 2026-03-13 08:11 - Added Grooming Notes comment to `TTT-16` documenting READY status, DoR checklist results, key decisions, and testing-spec classification summary.
- 2026-03-13 08:11 - Transitioned Jira ticket `TTT-16` from `To Do` to `Groomed`.
- 2026-03-13 08:11 - Closed active grooming entry and reset tracker to idle state.
- 2026-03-13 08:14 - Received implementation assignment for `TTT-16`; reviewed current app files and transitioned the Jira ticket from `Groomed` to `In Progress`.
- 2026-03-13 08:14 - Confirmed the app surface is still limited to `src/App.tsx`, `src/main.tsx`, and `src/index.css`, so this story can be implemented without broader architecture changes.
- 2026-03-13 08:16 - Implemented the `TTT-16` landing flow in `src/App.tsx`: added `X`/`O`/`Random` selection, `Play vs CPU` CTA wiring, and a lightweight started-game view that exposes the resolved player/CPU marks.
- 2026-03-13 08:16 - Validation passed locally with `npm run format:check`, `npm run lint`, and `npm run build`.
- 2026-03-13 08:16 - Added implementation evidence comment on Jira issue `TTT-16`.
- 2026-03-13 08:16 - Transitioned Jira ticket `TTT-16` from `In Progress` to `IN QA`.
- 2026-03-13 08:37 - Deployed the current app with `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-static.ps1`; S3 sync completed and CloudFront invalidation `IBXY9RLYEOJ7KRYJSF7AZ23H3Z` was created for distribution `EGW5O3MVJM73U`.
- 2026-03-13 08:37 - Verified the deployed URL `https://dh0s8gqynjyz6.cloudfront.net` returned `HTTP/1.1 200 OK`; added deployment evidence comment on Jira issue `TTT-16`.

## Blockers/Risks
- None.

## Next Action
- Await QA validation on `TTT-16`; if it passes, move it from `IN QA` to `In Review`.
