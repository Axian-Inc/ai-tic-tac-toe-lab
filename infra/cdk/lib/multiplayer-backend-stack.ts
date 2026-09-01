import * as path from 'node:path';
import {
  Arn,
  ArnFormat,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  Tags,
} from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface MultiplayerBackendStackProps extends StackProps {
  readonly environmentName: string;
  readonly retainData: boolean;
  readonly allowedOrigins: string[];
  readonly lambdaArtifactPath: string;
  readonly httpLambdaHandler: string;
  readonly webSocketLambdaHandler: string;
  readonly logRetention: logs.RetentionDays;
}

const CAPACITY_LIMIT = 25;
const ABANDONMENT_SECONDS = 180;
const CAPACITY_PARTITION_KEY = 'CAPACITY#GLOBAL';
const CAPACITY_SORT_KEY = 'CAPACITY#GLOBAL';

export class MultiplayerBackendStack extends Stack {
  public readonly gameTable: dynamodb.Table;
  public readonly connectionTable: dynamodb.Table;
  public readonly httpApi: apigwv2.HttpApi;
  public readonly webSocketApi: apigwv2.WebSocketApi;
  public readonly webSocketStage: apigwv2.WebSocketStage;
  public readonly httpFunction: lambda.Function;
  public readonly webSocketFunction: lambda.Function;

  public constructor(
    scope: Construct,
    id: string,
    props: MultiplayerBackendStackProps,
  ) {
    super(scope, id, props);

    const removalPolicy = props.retainData
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    this.gameTable = new dynamodb.Table(this, 'GameData', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy,
      deletionProtection: props.retainData,
    });
    this.gameTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.connectionTable = new dynamodb.Table(this, 'ConnectionData', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      timeToLiveAttribute: 'expiresAt',
      removalPolicy,
      deletionProtection: props.retainData,
    });
    this.connectionTable.addGlobalSecondaryIndex({
      indexName: 'GameSubscriptions',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    const httpLogGroup = new logs.LogGroup(this, 'HttpFunctionLogs', {
      retention: props.logRetention,
      removalPolicy,
    });
    const webSocketLogGroup = new logs.LogGroup(
      this,
      'WebSocketFunctionLogs',
      {
        retention: props.logRetention,
        removalPolicy,
      },
    );
    const httpAccessLogs = new logs.LogGroup(this, 'HttpAccessLogs', {
      retention: props.logRetention,
      removalPolicy,
    });
    const webSocketAccessLogs = new logs.LogGroup(
      this,
      'WebSocketAccessLogs',
      {
        retention: props.logRetention,
        removalPolicy,
      },
    );
    for (const accessLogGroup of [httpAccessLogs, webSocketAccessLogs]) {
      accessLogGroup.addToResourcePolicy(
        new iam.PolicyStatement({
          principals: [new iam.ServicePrincipal('apigateway.amazonaws.com')],
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [`${accessLogGroup.logGroupArn}:*`],
        }),
      );
    }

    const httpRole = this.createLambdaRole('HttpFunctionRole', httpLogGroup);
    const webSocketRole = this.createLambdaRole(
      'WebSocketFunctionRole',
      webSocketLogGroup,
    );
    const code = lambda.Code.fromAsset(path.resolve(props.lambdaArtifactPath));

    this.httpFunction = new lambda.Function(this, 'HttpFunction', {
      runtime: lambda.Runtime.DOTNET_10,
      architecture: lambda.Architecture.ARM_64,
      code,
      handler: props.httpLambdaHandler,
      role: httpRole,
      logGroup: httpLogGroup,
      memorySize: 512,
      timeout: Duration.seconds(20),
      tracing: lambda.Tracing.ACTIVE,
      environment: this.commonEnvironment(props.allowedOrigins),
    });
    this.webSocketFunction = new lambda.Function(this, 'WebSocketFunction', {
      runtime: lambda.Runtime.DOTNET_10,
      architecture: lambda.Architecture.ARM_64,
      code,
      handler: props.webSocketLambdaHandler,
      role: webSocketRole,
      logGroup: webSocketLogGroup,
      memorySize: 512,
      timeout: Duration.seconds(20),
      tracing: lambda.Tracing.ACTIVE,
      environment: this.commonEnvironment(props.allowedOrigins),
    });

    this.addGameTablePermissions(httpRole, true);
    this.addGameTablePermissions(webSocketRole, false);
    this.addConnectionTablePermissions(httpRole, false);
    this.addConnectionTablePermissions(webSocketRole, true);

    const httpIntegration = new integrations.HttpLambdaIntegration(
      'HttpIntegration',
      this.httpFunction,
    );
    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      createDefaultStage: true,
      corsPreflight: {
        allowOrigins: props.allowedOrigins,
        allowMethods: [apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST],
        allowHeaders: ['authorization', 'content-type'],
        exposeHeaders: ['location', 'retry-after'],
        maxAge: Duration.hours(1),
      },
    });
    this.addHttpRoutes(httpIntegration);

    const webSocketIntegration = new integrations.WebSocketLambdaIntegration(
      'WebSocketIntegration',
      this.webSocketFunction,
    );
    this.webSocketApi = new apigwv2.WebSocketApi(this, 'WebSocketApi', {
      routeSelectionExpression: '$request.body.action',
      connectRouteOptions: { integration: webSocketIntegration },
      disconnectRouteOptions: { integration: webSocketIntegration },
      defaultRouteOptions: { integration: webSocketIntegration },
    });
    this.webSocketApi.addRoute('subscribe', {
      integration: webSocketIntegration,
    });
    this.webSocketStage = new apigwv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: this.webSocketApi,
      stageName: 'ws',
      autoDeploy: true,
    });

    this.configureStage(
      this.httpApi.defaultStage?.node.defaultChild as apigwv2.CfnStage,
      httpAccessLogs,
      50,
      100,
    );
    this.configureStage(
      this.webSocketStage.node.defaultChild as apigwv2.CfnStage,
      webSocketAccessLogs,
      25,
      50,
    );

    const managementApiArn = Arn.format(
      {
        service: 'execute-api',
        resource: this.webSocketApi.apiId,
        resourceName: 'ws/POST/@connections/*',
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      },
      this,
    );
    for (const role of [httpRole, webSocketRole]) {
      role.addToPolicy(
        new iam.PolicyStatement({
          actions: ['execute-api:ManageConnections'],
          resources: [managementApiArn],
        }),
      );
    }

    const managementEndpoint = `https://${this.webSocketApi.apiId}.execute-api.${this.region}.${this.urlSuffix}/ws`;
    for (const fn of [this.httpFunction, this.webSocketFunction]) {
      fn.addEnvironment('WEBSOCKET_MANAGEMENT_ENDPOINT', managementEndpoint);
    }

    this.addAlarms();
    this.addOutputs(managementEndpoint);

    Tags.of(this).add('Application', 'ai-tic-tac-toe');
    Tags.of(this).add('Environment', props.environmentName);
    Tags.of(this).add('ManagedBy', 'aws-cdk');
    Tags.of(this).add('Phase', '2');
  }

  private commonEnvironment(allowedOrigins: string[]): Record<string, string> {
    return {
      GAME_TABLE_NAME: this.gameTable.tableName,
      CONNECTION_TABLE_NAME: this.connectionTable.tableName,
      GAME_STATUS_INDEX_NAME: 'StatusIndex',
      GAME_SUBSCRIPTIONS_INDEX_NAME: 'GameSubscriptions',
      GAME_CAPACITY_LIMIT: String(CAPACITY_LIMIT),
      CAPACITY_PARTITION_KEY,
      CAPACITY_SORT_KEY,
      ABANDONMENT_SECONDS: String(ABANDONMENT_SECONDS),
      ALLOWED_WEB_ORIGINS: allowedOrigins.join(','),
    };
  }

  private createLambdaRole(id: string, logGroup: logs.LogGroup): iam.Role {
    const role = new iam.Role(this, id, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [`${logGroup.logGroupArn}:*`],
      }),
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      }),
    );
    return role;
  }

  private addGameTablePermissions(role: iam.Role, write: boolean): void {
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: write
          ? [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:TransactGetItems',
              'dynamodb:TransactWriteItems',
            ]
          : ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:TransactGetItems'],
        resources: [
          this.gameTable.tableArn,
          `${this.gameTable.tableArn}/index/StatusIndex`,
        ],
      }),
    );
  }

  private addConnectionTablePermissions(role: iam.Role, write: boolean): void {
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: write
          ? [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
            ]
          : ['dynamodb:DeleteItem', 'dynamodb:Query'],
        resources: [
          this.connectionTable.tableArn,
          `${this.connectionTable.tableArn}/index/GameSubscriptions`,
        ],
      }),
    );
  }

  private addHttpRoutes(
    integration: integrations.HttpLambdaIntegration,
  ): void {
    const routes: Array<[apigwv2.HttpMethod, string]> = [
      [apigwv2.HttpMethod.POST, '/api/v1/games'],
      [apigwv2.HttpMethod.GET, '/api/v1/games'],
      [apigwv2.HttpMethod.GET, '/api/v1/games/{gameId}'],
      [apigwv2.HttpMethod.GET, '/api/v1/games/{gameId}/events'],
      [apigwv2.HttpMethod.POST, '/api/v1/games/{gameId}/join'],
      [apigwv2.HttpMethod.POST, '/api/v1/games/{gameId}/moves'],
      [apigwv2.HttpMethod.POST, '/api/v1/games/{gameId}/resign'],
      [
        apigwv2.HttpMethod.POST,
        '/api/v1/games/{gameId}/abandonment-check',
      ],
    ];
    for (const [method, routePath] of routes) {
      this.httpApi.addRoutes({
        path: routePath,
        methods: [method],
        integration,
      });
    }
  }

  private configureStage(
    stage: apigwv2.CfnStage,
    accessLogs: logs.LogGroup,
    throttlingRateLimit: number,
    throttlingBurstLimit: number,
  ): void {
    stage.accessLogSettings = {
      destinationArn: accessLogs.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        routeKey: '$context.routeKey',
        status: '$context.status',
        integrationError: '$context.integrationErrorMessage',
        responseLength: '$context.responseLength',
      }),
    };
    stage.defaultRouteSettings = {
      detailedMetricsEnabled: true,
      throttlingRateLimit,
      throttlingBurstLimit,
    };
  }

  private addAlarms(): void {
    for (const [id, fn] of [
      ['Http', this.httpFunction],
      ['WebSocket', this.webSocketFunction],
    ] as const) {
      new cloudwatch.Alarm(this, `${id}FunctionErrors`, {
        metric: fn.metricErrors({ period: Duration.minutes(5) }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      new cloudwatch.Alarm(this, `${id}FunctionThrottles`, {
        metric: fn.metricThrottles({ period: Duration.minutes(5) }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }

    for (const [id, apiId, stage] of [
      ['Http', this.httpApi.apiId, '$default'],
      ['WebSocket', this.webSocketApi.apiId, 'ws'],
    ] as const) {
      new cloudwatch.Alarm(this, `${id}ApiServerErrors`, {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5xx',
          dimensionsMap: { ApiId: apiId, Stage: stage },
          statistic: 'Sum',
          period: Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }

    for (const [id, table] of [
      ['Game', this.gameTable],
      ['Connection', this.connectionTable],
    ] as const) {
      new cloudwatch.Alarm(this, `${id}TableThrottles`, {
        metric: table.metricThrottledRequestsForOperations({
          operations: [
            dynamodb.Operation.GET_ITEM,
            dynamodb.Operation.PUT_ITEM,
            dynamodb.Operation.UPDATE_ITEM,
            dynamodb.Operation.QUERY,
          ],
          period: Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    }
  }

  private addOutputs(managementEndpoint: string): void {
    const values: Record<string, [string, string]> = {
      HttpApiUrl: [this.httpApi.apiEndpoint, 'Public HTTP API base URL'],
      WebSocketUrl: [this.webSocketStage.url, 'Public WebSocket URL ending in /ws'],
      WebSocketManagementEndpoint: [
        managementEndpoint,
        'Server-only API Gateway management endpoint',
      ],
      GameTableName: [this.gameTable.tableName, 'Authoritative game/event table'],
      ConnectionTableName: [
        this.connectionTable.tableName,
        'Ephemeral connection/subscription table',
      ],
      CapacityPartitionKey: [
        CAPACITY_PARTITION_KEY,
        'Singleton capacity item partition key',
      ],
      CapacitySortKey: [CAPACITY_SORT_KEY, 'Singleton capacity item sort key'],
      GameCapacityLimit: [String(CAPACITY_LIMIT), 'Waiting plus active game limit'],
    };
    for (const [id, [value, description]] of Object.entries(values)) {
      new CfnOutput(this, id, { value, description });
    }
  }
}
