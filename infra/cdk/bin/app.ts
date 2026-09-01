#!/usr/bin/env node
import * as path from 'node:path';
import { App } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { MultiplayerBackendStack } from '../lib/multiplayer-backend-stack.js';
import { StaticWebStack } from '../lib/static-web-stack.js';

const app = new App({
  outdir: process.env.CDK_OUTDIR ?? path.resolve('cdk.out'),
});
const environmentName = readName(
  process.env.DEPLOY_ENVIRONMENT ?? app.node.tryGetContext('environment') ?? 'lnd',
);
const region =
  process.env.AWS_REGION ??
  process.env.CDK_DEFAULT_REGION ??
  app.node.tryGetContext('region') ??
  'us-west-2';
const account = process.env.AWS_ACCOUNT_ID ?? process.env.CDK_DEFAULT_ACCOUNT;
const retainData = readBoolean(
  process.env.RETAIN_DATA ?? app.node.tryGetContext('retainData') ?? 'true',
  'RETAIN_DATA',
);
const webBuildPath = path.resolve(
  process.env.WEB_BUILD_PATH ??
    app.node.tryGetContext('webBuildPath') ??
    '../../apps/web/dist',
);
const cdkRoot = path.resolve(import.meta.dirname, '../..');
const repositoryRoot = path.resolve(cdkRoot, '../..');
const configuredApiPublishPath =
  process.env.API_PUBLISH_PATH ?? app.node.tryGetContext('apiPublishPath');
const lambdaArtifactPath = configuredApiPublishPath
  ? path.resolve(repositoryRoot, configuredApiPublishPath)
  : path.resolve(cdkRoot, 'test/fixtures/lambda');
const httpLambdaHandler =
  process.env.HTTP_LAMBDA_HANDLER ??
  app.node.tryGetContext('httpLambdaHandler') ??
  'TicTacToe.Api::TicTacToe.Api.Placeholder::HttpHandler';
const webSocketLambdaHandler =
  process.env.WEBSOCKET_LAMBDA_HANDLER ??
  app.node.tryGetContext('webSocketLambdaHandler') ??
  'TicTacToe.Api::TicTacToe.Api.Placeholder::WebSocketHandler';
const allowedOrigins = readOrigins(
  process.env.ALLOWED_WEB_ORIGINS ??
    app.node.tryGetContext('allowedOrigins') ??
    'http://localhost:5173',
);
const logRetention = readLogRetention(
  process.env.LOG_RETENTION_DAYS ??
    app.node.tryGetContext('logRetentionDays') ??
    '14',
);

new MultiplayerBackendStack(app, `TicTacToe-${environmentName}-Backend`, {
  env: {
    ...(account ? { account } : {}),
    region,
  },
  environmentName,
  retainData,
  allowedOrigins,
  lambdaArtifactPath,
  httpLambdaHandler,
  webSocketLambdaHandler,
  logRetention,
  description: `AI Tic-Tac-Toe ${environmentName} multiplayer backend`,
});

new StaticWebStack(app, `TicTacToe-${environmentName}-Web`, {
  env: {
    ...(account ? { account } : {}),
    region,
  },
  environmentName,
  retainData,
  webBuildPath,
  description: `AI Tic-Tac-Toe ${environmentName} static web application`,
});

app.synth();

function readName(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{0,20}$/.test(normalized)) {
    throw new Error(
      'DEPLOY_ENVIRONMENT must start with a lowercase letter and contain at most 21 lowercase letters, numbers, or hyphens.',
    );
  }
  return normalized;
}

function readBoolean(value: string | boolean, name: string): boolean {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${name} must be either true or false.`);
}

function readOrigins(value: string | string[]): string[] {
  const origins = (Array.isArray(value) ? value : value.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0 || origins.some((origin) => origin === '*')) {
    throw new Error(
      'ALLOWED_WEB_ORIGINS must contain one or more explicit comma-separated origins; wildcard origins are forbidden.',
    );
  }
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error(`Invalid allowed web origin: ${origin}`);
    }
  }
  return origins;
}

function readLogRetention(value: string | number): logs.RetentionDays {
  const days = Number(value);
  const supported: Record<number, logs.RetentionDays> = {
    1: logs.RetentionDays.ONE_DAY,
    3: logs.RetentionDays.THREE_DAYS,
    5: logs.RetentionDays.FIVE_DAYS,
    7: logs.RetentionDays.ONE_WEEK,
    14: logs.RetentionDays.TWO_WEEKS,
    30: logs.RetentionDays.ONE_MONTH,
    60: logs.RetentionDays.TWO_MONTHS,
    90: logs.RetentionDays.THREE_MONTHS,
  };
  const retention = supported[days];
  if (!retention) {
    throw new Error(
      'LOG_RETENTION_DAYS must be one of 1, 3, 5, 7, 14, 30, 60, or 90.',
    );
  }
  return retention;
}
