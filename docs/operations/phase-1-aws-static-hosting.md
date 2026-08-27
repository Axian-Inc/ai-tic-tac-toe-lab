# Phase 1 AWS Static Hosting Runbook

This runbook covers the `TicTacToe-<environment>-Web` CDK stack. Reading,
synthesizing, and testing it requires no AWS credentials and changes no AWS
resources. Bootstrap, deploy, rollback, and teardown mutate AWS and therefore
require explicit approval for a named account and region.

## Resources and security posture

The stack creates:

- a private, versioned, SSE-S3 encrypted S3 asset bucket;
- an HTTPS CloudFront distribution with modern S3 OAC/SigV4;
- a bucket policy limited to that distribution plus an explicit deny for
  non-TLS S3 requests;
- a deployment custom resource that prunes stale assets and invalidates the
  distribution;
- CloudFormation outputs for URL, distribution, bucket, environment, and
  region.

CloudFront uses managed security headers, TLS 1.2 (2021), HTTP/2 and HTTP/3,
compression, HTTPS redirect, and `PriceClass_100`. No AWS account ID, bucket
name, credential, or DNS name is hardcoded.

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `DEPLOY_ENVIRONMENT` | `lnd` | Lowercase stack/environment suffix |
| `AWS_REGION` | `us-west-2` | Target/synth region |
| `AWS_ACCOUNT_ID` | unset | Required by the guarded deploy script |
| `RETAIN_DATA` | `true` | Retain bucket on stack deletion |
| `WEB_BUILD_PATH` | `apps/web/dist` | Built Vite asset directory |
| `ENABLE_AWS_DEPLOYMENT` | unset | Must equal `true` to deploy |
| `CONFIRM_AWS_DEPLOYMENT` | unset | Must equal `true` after human approval |

CDK context equivalents are available for local synth:
`environment`, `region`, `retainData`, and `webBuildPath`. Environment variables
take precedence. The environment name must start with a lowercase letter and
contain no more than 21 lowercase letters, numbers, or hyphens.

## Install, test, and synth safely

From the repository root:

```bash
npm ci
npm run build
npm run test:unit --workspace @tic-tac-toe/infra
npm run infra:synth
```

`npm run infra:synth` reads the built `apps/web/dist/index.html`, writes only
ignored `infra/cdk/cdk.out`, and performs no AWS API calls. To inspect a
different build without deploying:

```bash
WEB_BUILD_PATH=/absolute/path/to/dist npm run infra:synth
```

Before review, inspect the template for the bucket, bucket policy, OAC,
distribution, deployment custom resources, outputs, tags, and removal policy.
Do not commit `cdk.out`.

## One-time bootstrap

Bootstrap creates AWS resources and is not part of validation. After explicit
approval, confirm the identity and region:

```bash
aws sts get-caller-identity
aws configure get region
cd infra/cdk
npx cdk bootstrap aws://<approved-account-id>/<approved-region>
```

Record the operator, account, region, bootstrap command/result, and approval on
PH1-003. Never substitute an account inferred only from a local profile name.

## Approved deployment

The normal path is a push to `zebanaya-kepler`. The `Full verification` job
must pass first. The deployment job then requires:

- repository variable `ENABLE_AWS_DEPLOYMENT=true`;
- protected GitHub environment `axian-lnd` and its reviewer approval;
- variables `AWS_DEPLOY_ROLE_ARN`, `AWS_ACCOUNT_ID`, and optional `AWS_REGION`;
- an OIDC role restricted to this repository, integration branch, and
  environment;
- optional `RETAIN_DATA` (`true` when absent).

The workflow rebuilds the app on the deployment runner. The deploy wrapper
calls STS, refuses an account mismatch, and writes the account, region, stack,
commit, and website URL to the workflow summary.

For an exceptionally approved local deployment, first obtain short-lived
credentials and review `cdk diff`; then set every guard explicitly:

```bash
AWS_ACCOUNT_ID=<approved-account-id> \
AWS_REGION=us-west-2 \
DEPLOY_ENVIRONMENT=lnd \
RETAIN_DATA=true \
ENABLE_AWS_DEPLOYMENT=true \
CONFIRM_AWS_DEPLOYMENT=true \
npm run infra:deploy
```

The wrapper intentionally uses `--require-approval never` only after both
guards because non-interactive CI cannot answer prompts; the protected
environment is the approval control.

## Verification and evidence

Capture the workflow URL, commit SHA, CloudFormation stack ID/status, output
URL, approved account/region, and reviewer. Verify:

1. The CloudFront URL returns HTTP 200 over HTTPS.
2. HTTP redirects to HTTPS.
3. A client-side route returns the application shell.
4. The page loads its scripts/styles with no browser console or network errors.
5. Direct anonymous S3 object access is denied.
6. Phase 1 Playwright passes against the deployed URL.

Do not record credentials, signed URLs, or session tokens as evidence.

## Rollback

Application rollback is a forward deployment of a previously accepted commit:

1. Disable further delivery if the issue is unsafe.
2. Identify the last verified commit and its evidence.
3. Build and run all checks for that commit.
4. Obtain protected-environment approval and deploy it through the same
   account-verifying path.
5. Verify root/deep links and Playwright, then record the result.

CloudFormation automatically attempts infrastructure rollback on a failed
update. If it reaches `UPDATE_ROLLBACK_FAILED`, stop automation and have the
AWS owner inspect stack events before using `continue-update-rollback`. Do not
delete the stack merely to clear the failure. S3 versioning supports forensic
recovery but is not the application release mechanism.

## Teardown and retained-data cleanup

Default `RETAIN_DATA=true` leaves the bucket and versions behind if the stack
is destroyed. Teardown requires explicit approval and a recorded decision:

- Preserve evidence/data: destroy the stack and inventory the retained bucket
  for later owner-approved cleanup.
- Fully remove ephemeral L&D data: first deploy an approved change with
  `RETAIN_DATA=false`, verify its generated change set, and only then run
  `cd infra/cdk && npx cdk destroy TicTacToe-lnd-Web` (substitute only the
  fully resolved, approved environment stack). This invokes the auto-delete
  custom resource for objects and versions.

Confirm the fully resolved stack name, account, and region immediately before
either action. Never use a wildcard stack target. CloudFront deletion can take
several minutes; wait for CloudFormation completion and verify retained or
removed resources match the decision.

## Cost guidance

There is no continuously running compute in Phase 1. Charges vary with region,
traffic, asset size, cache behavior, invalidations, logs, and retained versions.
The primary drivers are:

- S3 stored bytes, versions, PUT/LIST/GET operations, and retained data;
- CloudFront requests and data transfer, primarily in the `PriceClass_100`
  geography;
- deployment Lambda/custom-resource execution and invalidation requests;
- CDK bootstrap bucket storage.

Before enabling delivery, enter expected monthly users, page weight, request
count, deploy frequency, and retained storage into the AWS Pricing Calculator;
save the estimate link or PDF with the ticket evidence. Configure an account
budget/alert outside this stack. Review retained buckets after each lab and
avoid repeated manual invalidations. No fixed dollar estimate is asserted
because AWS pricing and free-tier eligibility vary over time and account.

## Codex getting-started evidence

Phase 1 requires completion of the Codex CLI getting-started material. Each
participant should record non-secret evidence in the relevant ticket or PR:

- Codex CLI version and completion date;
- the official guide section completed;
- a short statement that authentication and one read-only repository command
  were verified in the devcontainer;
- any setup issue and its documented resolution.

Do not attach `auth.json`, account identifiers, tokens, prompts containing
secrets, or terminal captures with credentials. The coordinator reviews this
human evidence; CI cannot prove documentation completion.
