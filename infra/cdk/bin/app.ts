#!/usr/bin/env node
import * as path from 'node:path';
import { App } from 'aws-cdk-lib';
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
