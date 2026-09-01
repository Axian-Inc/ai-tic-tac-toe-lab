import assert from 'node:assert/strict';
import * as path from 'node:path';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { MultiplayerBackendStack } from '../lib/multiplayer-backend-stack.js';

const fixturePath = path.resolve('test/fixtures/lambda');

function synthesize(retainData = true): Template {
  const app = new App();
  const stack = new MultiplayerBackendStack(app, 'TestBackend', {
    environmentName: 'test',
    retainData,
    allowedOrigins: ['https://example.test', 'http://localhost:5173'],
    lambdaArtifactPath: fixturePath,
    httpLambdaHandler: 'Test.Api::Test.Api.Function::HttpHandler',
    webSocketLambdaHandler: 'Test.Api::Test.Api.Function::WebSocketHandler',
    logRetention: logs.RetentionDays.TWO_WEEKS,
    env: { account: '111111111111', region: 'us-west-2' },
  });
  return Template.fromStack(stack);
}

run('uses encrypted on-demand tables with PITR and required access indexes', () => {
  const template = synthesize();

  template.resourceCountIs('AWS::DynamoDB::Table', 2);
  template.allResourcesProperties('AWS::DynamoDB::Table', {
    BillingMode: 'PAY_PER_REQUEST',
    SSESpecification: { SSEEnabled: true },
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
  });
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    GlobalSecondaryIndexes: Match.arrayWith([
      Match.objectLike({ IndexName: 'StatusIndex' }),
    ]),
  });
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TimeToLiveSpecification: {
      AttributeName: 'expiresAt',
      Enabled: true,
    },
    GlobalSecondaryIndexes: Match.arrayWith([
      Match.objectLike({ IndexName: 'GameSubscriptions' }),
    ]),
  });
  template.allResources('AWS::DynamoDB::Table', {
    DeletionPolicy: 'Retain',
    UpdateReplacePolicy: 'Retain',
  });
});

run('packages separate managed .NET 10 arm64 handlers with frozen settings', () => {
  const template = synthesize();

  template.resourceCountIs('AWS::Lambda::Function', 2);
  for (const handler of [
    'Test.Api::Test.Api.Function::HttpHandler',
    'Test.Api::Test.Api.Function::WebSocketHandler',
  ]) {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'dotnet10',
      Architectures: ['arm64'],
      Handler: handler,
      MemorySize: 512,
      Timeout: 20,
      TracingConfig: { Mode: 'Active' },
      Environment: {
        Variables: Match.objectLike({
          GAME_CAPACITY_LIMIT: '25',
          CAPACITY_PARTITION_KEY: 'CAPACITY#GLOBAL',
          CAPACITY_SORT_KEY: 'CAPACITY#GLOBAL',
          ABANDONMENT_SECONDS: '180',
          GAME_STATUS_INDEX_NAME: 'StatusIndex',
          GAME_SUBSCRIPTIONS_INDEX_NAME: 'GameSubscriptions',
          WEBSOCKET_MANAGEMENT_ENDPOINT: Match.anyValue(),
          ALLOWED_WEB_ORIGINS: 'https://example.test,http://localhost:5173',
        }),
      },
    });
  }
});

run('binds only frozen HTTP and WebSocket routes with CORS and throttling', () => {
  const template = synthesize();
  const json = template.toJSON();

  template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
    ProtocolType: 'HTTP',
    CorsConfiguration: {
      AllowOrigins: ['https://example.test', 'http://localhost:5173'],
      AllowMethods: ['GET', 'POST'],
      AllowHeaders: ['authorization', 'content-type'],
      ExposeHeaders: ['location', 'retry-after'],
      MaxAge: 3600,
    },
  });
  template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
    ProtocolType: 'WEBSOCKET',
    RouteSelectionExpression: '$request.body.action',
  });

  const routeKeys = Object.values(json.Resources)
    .filter((resource): resource is { Type: string; Properties: { RouteKey: string } } =>
      (resource as { Type?: string }).Type === 'AWS::ApiGatewayV2::Route',
    )
    .map((resource) => resource.Properties.RouteKey)
    .sort();
  assert.deepEqual(routeKeys, [
    '$connect',
    '$default',
    '$disconnect',
    'GET /api/v1/games',
    'GET /api/v1/games/{gameId}',
    'GET /api/v1/games/{gameId}/events',
    'POST /api/v1/games',
    'POST /api/v1/games/{gameId}/abandonment-check',
    'POST /api/v1/games/{gameId}/join',
    'POST /api/v1/games/{gameId}/moves',
    'POST /api/v1/games/{gameId}/resign',
    'subscribe',
  ]);
  template.resourceCountIs('AWS::ApiGatewayV2::Stage', 2);
  template.allResourcesProperties('AWS::ApiGatewayV2::Stage', {
    AccessLogSettings: {
      DestinationArn: Match.anyValue(),
      Format: Match.anyValue(),
    },
    DefaultRouteSettings: Match.objectLike({
      DetailedMetricsEnabled: true,
      ThrottlingBurstLimit: Match.anyValue(),
      ThrottlingRateLimit: Match.anyValue(),
    }),
  });
  template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
    StageName: 'ws',
  });
});

run('scopes data and management IAM and provisions logs, alarms, and outputs', () => {
  const template = synthesize();
  const json = template.toJSON();

  template.resourceCountIs('AWS::CloudWatch::Alarm', 8);
  template.resourceCountIs('AWS::Logs::LogGroup', 4);
  template.allResourcesProperties('AWS::Logs::LogGroup', {
    RetentionInDays: 14,
  });
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: 'execute-api:ManageConnections',
          Resource: Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
        }),
      ]),
    },
  });
  template.resourceCountIs('AWS::Logs::ResourcePolicy', 2);
  const logResourcePolicies = Object.values(json.Resources).filter(
    (resource) => (resource as { Type?: string }).Type === 'AWS::Logs::ResourcePolicy',
  );
  for (const policy of logResourcePolicies) {
    const serialized = JSON.stringify(policy);
    assert.match(serialized, /apigateway\.amazonaws\.com/);
    assert.match(serialized, /logs:CreateLogStream/);
    assert.match(serialized, /logs:PutLogEvents/);
  }

  const policyStatements = Object.values(json.Resources)
    .filter((resource) => (resource as { Type?: string }).Type === 'AWS::IAM::Policy')
    .flatMap((resource) => {
      const document = (resource as {
        Properties: { PolicyDocument: { Statement: Array<{ Action?: string | string[]; Resource?: unknown }> } };
      }).Properties.PolicyDocument;
      return document.Statement;
    });
  const dataStatements = policyStatements.filter((statement) =>
    [statement.Action].flat().some((action) => action?.startsWith('dynamodb:')),
  );
  assert.ok(dataStatements.length > 0, 'Expected DynamoDB policy statements');
  assert.ok(
    dataStatements.some((statement) => [statement.Action].flat().includes('dynamodb:Scan')),
    'Expected the HTTP role to scan held-capacity records during guarded reconciliation',
  );
  assert.ok(
    dataStatements.every((statement) => statement.Resource !== '*'),
    'DynamoDB data permissions must not use wildcard resources',
  );

  const outputs = Object.keys(json.Outputs);
  for (const expected of [
    'HttpApiUrl',
    'WebSocketUrl',
    'WebSocketManagementEndpoint',
    'GameTableName',
    'ConnectionTableName',
    'CapacityPartitionKey',
    'CapacitySortKey',
    'GameCapacityLimit',
  ]) {
    assert.ok(outputs.includes(expected), `Missing ${expected}`);
  }
});

run('supports explicitly authorized ephemeral backend teardown', () => {
  const template = synthesize(false);

  template.allResources('AWS::DynamoDB::Table', {
    DeletionPolicy: 'Delete',
    UpdateReplacePolicy: 'Delete',
  });
  template.allResources('AWS::Logs::LogGroup', {
    DeletionPolicy: 'Delete',
    UpdateReplacePolicy: 'Delete',
  });
});

function run(name: string, assertion: () => void): void {
  try {
    assertion();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n`);
    throw error;
  }
}
