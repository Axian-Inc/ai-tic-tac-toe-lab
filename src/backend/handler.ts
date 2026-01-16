import awsLambdaFastify from '@fastify/aws-lambda';

import { buildApp } from './app';

const app = buildApp({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  enableCors: false,
});

export const handler = awsLambdaFastify(app);
