import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'node:path';

export type ApiStackProps = cdk.StackProps & {
  stage: string;
};

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const repoRoot = path.join(__dirname, '..', '..');
    const handlerEntry = path.join(repoRoot, 'src', 'backend', 'handler.ts');

    const apiFunction = new NodejsFunction(this, 'ApiFunction', {
      functionName: `tic-tac-toe-api-${props.stage}`,
      entry: handlerEntry,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(15),
      memorySize: 512,
      projectRoot: repoRoot,
      depsLockFilePath: path.join(repoRoot, 'package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
      },
      environment: {
        BEDROCK_REGION: process.env.BEDROCK_REGION ?? 'us-west-2',
        BEDROCK_MODEL_ID:
          process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
        LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
      },
    });

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      }),
    );

    const logRetention =
      props.stage === 'prod' ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK;

    new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/${apiFunction.functionName}`,
      retention: logRetention,
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [lambda.HttpMethod.POST],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      },
    });

    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
    });
  }
}
