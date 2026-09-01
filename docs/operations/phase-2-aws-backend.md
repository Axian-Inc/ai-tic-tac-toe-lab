# Phase 2 AWS multiplayer backend runbook

This runbook covers the low-volume Axian L&D backend defined by PH2-004. It
does not authorize an AWS change. Deployment and teardown require explicit
approval of the account, region, commit, change set, and retention mode.

## Architecture and cost posture

`TicTacToe-<environment>-Backend` is separate from the Phase 1 web stack. It
contains:

- an API Gateway HTTP API exposing only the eight routes frozen in
  `contracts/openapi.yaml`;
- an API Gateway WebSocket API whose `ws` stage provides the frozen `/ws`
  endpoint and `$connect`, `$disconnect`, `$default`, and `subscribe` routes;
- separate HTTP and WebSocket .NET 10 Lambda handlers, using managed
  Amazon Linux 2023 arm64 zip deployments;
- an authoritative DynamoDB game/event table and an ephemeral
  connection/subscription table;
- short-retention function and API access logs; and
- actionless CloudWatch alarms for Lambda errors/throttles, API 5xx responses,
  and DynamoDB throttles.

Both tables use on-demand billing, AWS-owned encryption, and point-in-time
recovery. This avoids idle database/compute capacity. Primary cost drivers are
HTTP requests, WebSocket messages and connection-minutes, Lambda invocations
and duration, DynamoDB requests/storage/PITR, log ingestion/retention, X-Ray
traces, and eight CloudWatch alarms. Static hosting costs remain described in
the Phase 1 runbook. Review actual AWS pricing for `us-west-2` before enabling
delivery; this repository intentionally does not promise a fixed bill.

API throttles protect the lab from request spikes but do not enforce the
25-game domain limit. The server must conditionally update the singleton
capacity item in the same DynamoDB transaction as each create or terminal
transition.

## Internal DynamoDB access patterns

These names are private persistence seams, not additions to the HTTP or
WebSocket contract.

The game table uses string `PK`/`SK` keys:

| Item/access | Key convention |
| --- | --- |
| Aggregate | `PK=GAME#<gameId>`, `SK=STATE` |
| Ordered event | `PK=GAME#<gameId>`, `SK=EVENT#<zero-padded-sequence>` |
| Command receipt | `PK=GAME#<gameId>`, `SK=COMMAND#<commandId>` |
| Global create receipt | `PK=COMMAND#<commandId>`, `SK=CREATE` |
| Capacity singleton | `PK=CAPACITY#GLOBAL`, `SK=CAPACITY#GLOBAL` |
| Status list | `GSI1PK=STATUS#<waiting|active|over>`, `GSI1SK=<updatedAt>#<gameId>` on aggregate items |

The `StatusIndex` is intentionally eventually consistent. Aggregate and event
reads use the base table's strongly consistent `GetItem`/`Query`. Events remain
for the complete Phase 2 game lifetime. Receipt contents containing a seat
capability are encrypted at rest and must never be logged or projected into the
status index.

The connection table uses:

| Item/access | Key convention |
| --- | --- |
| Connection | `PK=CONNECTION#<connectionId>`, `SK=CONNECTION` |
| Subscription | `PK=CONNECTION#<connectionId>`, `SK=GAME#<gameId>` |
| Game broadcast | `GSI1PK=GAME#<gameId>`, `GSI1SK=CONNECTION#<connectionId>` |

`GameSubscriptions` supports broadcast without a scan. `expiresAt` is a Unix
epoch-seconds TTL used only for connection/subscription cleanup; it must not be
used on game, event, or receipt items. A management API `410 Gone` response
causes immediate deletion of the stale connection and subscriptions. TTL is a
backstop and is not instantaneous.

## Security and configuration

- CORS accepts one or more explicit origins from `ALLOWED_WEB_ORIGINS`.
  Wildcard origins are rejected.
- Phase 2 has no user identity provider. Lambda validates the opaque game-seat
  capability required by the public contract. Access logs omit bodies,
  authorization headers, tokens, and game data.
- Lambda roles contain scoped table/index data actions. Only the two backend
  functions may call `execute-api:ManageConnections`, and only against this
  WebSocket API's `ws/POST/@connections/*` ARN.
- Table and log removal policies follow `RETAIN_DATA`. Retained environments
  enable DynamoDB deletion protection.
- Account, region, origins, environment, retention, artifact path, and handler
  names are configuration; no credentials or account IDs belong in source.

CDK synthesis uses `infra/cdk/test/fixtures/lambda` and placeholder handler
names because the application artifact is delivered by PH2-001. The guarded
deployment script rejects that fixture, rejects placeholder handlers, and
requires the artifact directory to contain published DLLs. Before any deploy,
replace the following application handoff seams:

- `API_PUBLISH_PATH`;
- `HTTP_LAMBDA_HANDLER`;
- `WEBSOCKET_LAMBDA_HANDLER`;
- `WEB_HTTP_URL_ENV_NAME`; and
- `WEB_WEBSOCKET_URL_ENV_NAME`.

Use these application-owned values:

- `API_PUBLISH_PATH=artifacts/lambda`;
- `HTTP_LAMBDA_HANDLER=TicTacToe.Api`;
- `WEBSOCKET_LAMBDA_HANDLER=TicTacToe.Api::TicTacToe.Api.WebSocketLambdaFunction::FunctionHandlerAsync`;
- `WEB_HTTP_URL_ENV_NAME=VITE_API_BASE_URL`; and
- `WEB_WEBSOCKET_URL_ENV_NAME=VITE_WS_URL`.

`VITE_API_BASE_URL` receives the HTTP origin and the client appends `/api/v1`.
`VITE_WS_URL` receives the complete WebSocket URL including `/ws`.
`API_PUBLISH_PATH` is repository-root-relative (or absolute for a local,
approved dry run); the protected workflow should use a repository-relative
publish directory.

## Local build, test, and synthesis

From the repository root:

```bash
npm ci
npm run build
npm run test:unit --workspace @tic-tac-toe/infra
npm run infra:synth
```

Synthesis is non-mutating and defaults to localhost CORS, 14-day logs, retained
data, and the synthesis-only Lambda fixture. For an application-integrated
change summary, publish the Lambda artifact and provide the real seams:

```bash
export API_PUBLISH_PATH=artifacts/lambda
export HTTP_LAMBDA_HANDLER='TicTacToe.Api'
export WEBSOCKET_LAMBDA_HANDLER='TicTacToe.Api::TicTacToe.Api.WebSocketLambdaFunction::FunctionHandlerAsync'
export WEB_HTTP_URL_ENV_NAME=VITE_API_BASE_URL
export WEB_WEBSOCKET_URL_ENV_NAME=VITE_WS_URL
export ALLOWED_WEB_ORIGINS='https://confirmed-cloudfront-origin.example'
export DEPLOY_ENVIRONMENT=lnd
export AWS_ACCOUNT_ID='<confirmed-account>'
export AWS_REGION=us-west-2
npm run build
npm run compile --workspace @tic-tac-toe/infra
cd infra/cdk
npx cdk diff TicTacToe-lnd-Backend --app 'node .cdk-dist/bin/app.js'
```

`cdk diff` may perform AWS lookups and is not part of offline CI. Run it only
with approved read access to the confirmed account/region. Never commit
`cdk.out`, `.deployment`, published artifacts, or credentials.

## Bootstrap and protected deployment

An administrator bootstraps the confirmed account/region once with short-lived
credentials. Review the bootstrap permissions separately; bootstrap itself is
an AWS mutation.

The GitHub push workflow may deploy only after the integrated SHA passes full
verification, `ENABLE_AWS_DEPLOYMENT=true`, the protected `axian-lnd`
environment approves, and OIDC assumes the account-scoped role. Configure all
required values above plus:

- `AWS_DEPLOY_ROLE_ARN` and `AWS_ACCOUNT_ID`;
- `AWS_REGION` (defaults to `us-west-2`);
- `RETAIN_DATA` (defaults to `true`);
- `LOG_RETENTION_DAYS` (defaults to `14`); and
- `ALLOWED_WEB_ORIGINS` containing the deployed HTTPS web origin.

`npm run infra:deploy` performs the approved two-stage delivery:

1. verifies the caller account through STS;
2. deploys `TicTacToe-<environment>-Backend`;
3. reads its `HttpApiUrl` and `WebSocketUrl` outputs;
4. rebuilds only the Vite web workspace with those URLs under the exact
   application-provided variable names;
5. deploys `TicTacToe-<environment>-Web`; and
6. records both stack names, the SHA, region, website, HTTP URL, and WebSocket
   URL in the workflow summary.

Never substitute `cdk deploy --all`: a first deployment cannot inject API
Gateway URLs into a bundle built before those URLs exist.

## Post-deployment verification

Record the workflow URL and outputs on PH2-004. Do not record seat tokens,
requests containing capabilities, table contents, or credentials.

1. Load the CloudFront URL and confirm Phase 1 single-player still works.
2. Create and join one multiplayer game through two browsers.
3. Confirm both clients receive contiguous WebSocket sequences.
4. Disconnect/reconnect one client and verify replay closes the gap.
5. Complete a move and resignation flow, then verify terminal state.
6. Inspect alarms and sanitized access logs for unexpected errors or tokens.
7. Run the approved concurrent capacity test in an isolated test namespace;
   confirm the 26th waiting/active game receives HTTP 429 and that terminal
   transitions release slots.

## Rollback

CloudFormation rolls back a failed stack update by default. If backend deploy
succeeds but the web rebuild or web deployment fails, the previous web bundle
remains available and the new backend must remain backward-compatible with it.
Fix forward or redeploy the last verified SHA; do not manually edit Lambda,
API Gateway, or DynamoDB resources.

For an intentional application rollback, select a previously verified commit,
confirm that its HTTP/WebSocket and storage contracts are compatible with
current data, approve its CDK diff, and run the same two-stage deployment.
Schema-incompatible rollback requires an application-owned migration/recovery
plan and must not proceed from this runbook alone.

## Recovery and capacity reconciliation

Use DynamoDB point-in-time recovery to restore a table to a new table. Do not
overwrite the source table. Validate aggregate/event replay, command receipts,
token protection, and the capacity singleton before redirecting an approved
application deployment to restored tables.

The expected capacity value equals the number of aggregates whose status is
`waiting` or `active` and whose `capacityHeld` flag is true. The status GSI is
eventually consistent, so it is not by itself authoritative for repair. PH2-001
must provide an application-owned reconciliation command that performs a
read-only report first and uses a conditional repair against a stable snapshot.
Until that command is delivered and tested, operators must alert and stop new
creates rather than manually rewriting the singleton. Automatic expiry of
waiting games is explicitly outside Phase 2.

## Teardown

Teardown is a separate destructive approval. Reconfirm STS account, region,
environment, retained-data consequences, and recovery owner.

- With `RETAIN_DATA=true`, destroying the backend removes APIs and functions
  but retains tables and logs. DynamoDB deletion protection must be explicitly
  disabled by an approved change before CloudFormation can remove the stack;
  this is deliberate protection against accidental data loss.
- With `RETAIN_DATA=false`, the stack may delete both tables and logs. This is
  irreversible after PITR and retained resources are removed.
- Destroying the backend does not destroy the independent web stack.

Never use broad recursive cleanup or delete retained resources by name. Use an
approved CDK/CloudFormation change against the exact stack and record what was
retained or deleted.
