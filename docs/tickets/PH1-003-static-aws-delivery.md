# PH1-003: Deliver Phase 1 static application

- Status: ready
- Owner: docs-delivery
- Branch: `docs-delivery/phase-1-aws`
- Dependencies: FND-002, FND-003, PH1-001, PH1-002
- Requirement source: `docs/requirements/phase-1.md`

## Acceptance criteria

- [x] Define private S3 and HTTPS CloudFront resources with CDK assertions.
- [x] Parameterize environment, account, region, and retention behavior.
- [x] Document bootstrap, synth, approved deploy, verification, rollback, teardown, and cost drivers.
- [ ] Record the verified deployment URL only after explicit AWS approval.

## Implementation notes

Synth must not mutate AWS. Deployment defaults to disabled. The asset bucket
is retained by default; destructive L&D cleanup is explicit and guarded.

## Automated/manual evidence

- `npm run lint --workspace @tic-tac-toe/infra`: passed.
- `npm run test:unit --workspace @tic-tac-toe/infra`: four CDK assertion
  scenarios passed for security, routing, deployment, outputs, and retention.
- Fixture-backed `npm run infra:synth`: produced
  `TicTacToe-lnd-Web.template.json` with one S3 bucket/policy, OAC,
  distribution, and deployment resource plus six documented outputs.
- Merged commit `1185521` passed the complete
  [push verification workflow](https://github.com/Axian-Inc/ai-tic-tac-toe-lab/actions/runs/33203947438)
  on 2026-08-28, including the real application build and CDK synthesis.
- The protected deployment job was skipped; no AWS mutation occurred.
- Pending: approved deployment workflow, URL, deployed Playwright result, and
  named account/region evidence.

## Documentation impact

Added ADR-007, the Phase 1 AWS runbook, CI guard configuration, README command
and cost guidance, and Codex getting-started evidence expectations.

## Commit or PR

PR #26, merged into `zebanaya-kepler`.

## Retrospective: integration lockfile conflict

After PRs #24 and #25 merged, PR #26 was updated by merging
`zebanaya-kepler`. Both sides had changed the root workspace list and
`package-lock.json`. The manifest conflict was resolved correctly, but the
lockfile was combined as text. That left inconsistent npm workspace-link
records even though the file remained valid JSON. On the next pull-request
run, npm Arborist failed while loading the virtual dependency tree with
`Cannot read properties of undefined (reading 'extraneous')`; `npm ci` then
reported the misleading generic message that no usable lockfile existed.
No build, deployment, or AWS mutation ran.

The repair was to regenerate `package-lock.json` from the combined manifests
and prove it with a clean `npm ci`. A subsequent Ubuntu run exposed npm's
platform-specific optional-dependency lockfile bug: regeneration on Windows
retained only the Windows Rollup and esbuild binaries. The root manifest now
declares the matching Linux x64 packages as optional dependencies so clean
installs remain reproducible on both development and CI platforms.

For future dependent agent PRs:

1. Refresh the branch after prerequisite PRs merge.
2. Resolve `package.json` and workspace membership intentionally.
3. Never hand-merge conflicting generated lockfile sections; regenerate the
   lockfile from the resolved manifests.
4. Run a clean install and the full non-deployment verification gate before
   pushing the refreshed branch.
5. When a lockfile is generated on a different OS than CI, verify that native
   optional packages required by the CI platform remain represented.

## Risks/follow-ups

- Account permissions and CDK bootstrap state require confirmation.
- The first deployment uses the generated CloudFront domain; custom
  DNS/certificate scope remains future work.
- `package-lock.json` changes add the explicitly approved infrastructure
  workspace dependencies.
