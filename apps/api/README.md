# Multiplayer API

The authoritative multiplayer domain targets .NET 10. Local development uses
the ASP.NET Core host and the atomic in-memory adapter. When
`GAME_TABLE_NAME` is configured, the host automatically selects the production
DynamoDB store and API Gateway Management API broadcaster. The WebSocket
Lambda uses the same production adapters directly.

## Build and test

From the repository root:

```text
dotnet restore apps/api/TicTacToe.Api.sln
dotnet build apps/api/TicTacToe.Api.sln --configuration Release --no-restore
dotnet test apps/api/TicTacToe.Api.sln --configuration Release --no-build
npm run publish:server
```

The publish command creates an architecture-neutral, framework-dependent
artifact in the ignored, repository-relative `artifacts/lambda` directory.
The Lambda resource selects the managed .NET 10 ARM64 runtime. Delivery must
use these exact CDK seams:

```text
API_PUBLISH_PATH=artifacts/lambda
HTTP_LAMBDA_HANDLER=TicTacToe.Api
WEBSOCKET_LAMBDA_HANDLER=TicTacToe.Api::TicTacToe.Api.WebSocketLambdaFunction::FunctionHandlerAsync
```

The HTTP executable handler is required by
`Amazon.Lambda.AspNetCoreServer.Hosting`; it must not be converted to the
class-library handler format.

## Capacity reconciliation

Production capacity is the count of games whose `capacityHeld` flag is true
and status is `waiting` or `active`. Reconciliation must first produce a
read-only report from a stable snapshot. Repair is permitted only when the
report's observed singleton version/value still match in a conditional
transaction. The application-owned command shape is:

```text
dotnet run --project apps/api/src/TicTacToe.Api -- capacity reconcile --report
dotnet run --project apps/api/src/TicTacToe.Api -- capacity reconcile --apply <snapshotVersion> <storedCapacity>
```

Always capture and review `--report` first. `--apply` conditionally succeeds
only when both values still match that report; otherwise it returns
`capacity_snapshot_changed`. The in-memory adapter makes the workflow testable
locally. An AWS run resolves `ICapacityReconciler` to `DynamoGameStore`, which
uses consistent scans bracketed by capacity-version reads and applies the
repair with a condition on both reported values. The Lambda role therefore
requires `dynamodb:Scan` on the game table in addition to its transactional
permissions. If the AWS environment variables are absent, operators must stop
creates and alert rather than treating a new in-memory process as authoritative
or manually updating the singleton.
