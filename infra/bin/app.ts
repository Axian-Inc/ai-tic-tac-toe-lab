import * as cdk from 'aws-cdk-lib';

import { ApiStack } from '../lib/api-stack';
import { WebStack } from '../lib/web-stack';

const app = new cdk.App();
const stage = app.node.tryGetContext('env') ?? 'dev';
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new ApiStack(app, `TicTacToeApi-${stage}`, { env, stage });
new WebStack(app, `TicTacToeWeb-${stage}`, { env, stage });
