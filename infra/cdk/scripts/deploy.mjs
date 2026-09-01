import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const required = [
  'AWS_ACCOUNT_ID',
  'AWS_REGION',
  'DEPLOY_ENVIRONMENT',
  'API_PUBLISH_PATH',
  'HTTP_LAMBDA_HANDLER',
  'WEBSOCKET_LAMBDA_HANDLER',
  'ALLOWED_WEB_ORIGINS',
  'WEB_HTTP_URL_ENV_NAME',
  'WEB_WEBSOCKET_URL_ENV_NAME',
];
if (process.env.ENABLE_AWS_DEPLOYMENT !== 'true') {
  fail('Deployment is disabled. Set ENABLE_AWS_DEPLOYMENT=true only after approval.');
}
if (process.env.CONFIRM_AWS_DEPLOYMENT !== 'true') {
  fail('Set CONFIRM_AWS_DEPLOYMENT=true after confirming the target account, region, and change.');
}
for (const name of required) {
  if (!process.env[name]?.trim()) fail(`${name} is required.`);
}

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const cdkRoot = resolve(import.meta.dirname, '..');
const artifactPath = resolve(repositoryRoot, process.env.API_PUBLISH_PATH);
if (!existsSync(artifactPath)) {
  fail(`API_PUBLISH_PATH does not exist: ${artifactPath}`);
}
if (artifactPath.includes(resolve(cdkRoot, 'test', 'fixtures', 'lambda'))) {
  fail('The synthesis-only Lambda fixture cannot be deployed.');
}
if (!readdirSync(artifactPath, { recursive: true }).some((entry) => String(entry).endsWith('.dll'))) {
  fail('API_PUBLISH_PATH must contain the application agent\'s published .NET Lambda DLLs.');
}
for (const name of ['HTTP_LAMBDA_HANDLER', 'WEBSOCKET_LAMBDA_HANDLER']) {
  if (process.env[name].includes('Placeholder')) {
    fail(`${name} still contains a synthesis-only placeholder.`);
  }
}
for (const name of ['WEB_HTTP_URL_ENV_NAME', 'WEB_WEBSOCKET_URL_ENV_NAME']) {
  if (!/^VITE_[A-Z0-9_]+$/.test(process.env[name])) {
    fail(`${name} must name an explicit VITE_ environment variable.`);
  }
}

const identity = run('aws', ['sts', 'get-caller-identity', '--output', 'json'], {
  capture: true,
  cwd: cdkRoot,
});
const actualAccount = JSON.parse(identity).Account;
if (actualAccount !== process.env.AWS_ACCOUNT_ID) {
  fail(
    `AWS identity account ${actualAccount} does not match approved AWS_ACCOUNT_ID ${process.env.AWS_ACCOUNT_ID}.`,
  );
}

const environmentName = process.env.DEPLOY_ENVIRONMENT;
const backendStack = `TicTacToe-${environmentName}-Backend`;
const webStack = `TicTacToe-${environmentName}-Web`;
const outputDirectory = resolve(cdkRoot, '.deployment');
const backendOutputFile = resolve(outputDirectory, 'backend-outputs.json');
const webOutputFile = resolve(outputDirectory, 'web-outputs.json');
mkdirSync(outputDirectory, { recursive: true });

run(
  'npx',
  [
    'cdk',
    'deploy',
    backendStack,
    '--require-approval',
    'never',
    '--outputs-file',
    backendOutputFile,
  ],
  { cwd: cdkRoot },
);
const backendOutputs = readStackOutputs(backendOutputFile, backendStack);
const httpApiUrl = requireOutput(backendOutputs, 'HttpApiUrl', backendStack);
const webSocketUrl = requireOutput(backendOutputs, 'WebSocketUrl', backendStack);

run(
  'npm',
  ['run', 'build', '--workspace', '@tic-tac-toe/web'],
  {
    cwd: repositoryRoot,
    env: {
      [process.env.WEB_HTTP_URL_ENV_NAME]: httpApiUrl,
      [process.env.WEB_WEBSOCKET_URL_ENV_NAME]: webSocketUrl,
    },
  },
);

run(
  'npx',
  [
    'cdk',
    'deploy',
    webStack,
    '--require-approval',
    'never',
    '--outputs-file',
    webOutputFile,
  ],
  { cwd: cdkRoot },
);
const webOutputs = readStackOutputs(webOutputFile, webStack);
const websiteUrl = requireOutput(webOutputs, 'WebsiteUrl', webStack);

const summary = [
  '### L&D deployment',
  `- Account: \`${actualAccount}\``,
  `- Region: \`${process.env.AWS_REGION}\``,
  `- Backend stack: \`${backendStack}\``,
  `- Web stack: \`${webStack}\``,
  `- Commit: \`${process.env.SOURCE_COMMIT ?? 'local'}\``,
  `- Website: ${websiteUrl}`,
  `- HTTP API: ${httpApiUrl}`,
  `- WebSocket: ${webSocketUrl}`,
  '',
].join('\n');

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
process.stdout.write(summary);

function readStackOutputs(file, stackName) {
  const allOutputs = JSON.parse(readFileSync(file, 'utf8'));
  const outputs = allOutputs[stackName];
  if (!outputs) fail(`CDK did not return outputs for ${stackName}.`);
  return outputs;
}

function requireOutput(outputs, name, stackName) {
  const value = outputs[name];
  if (!value) fail(`${stackName} did not return required output ${name}.`);
  return value;
}

function run(command, args, options = {}) {
  const executable =
    process.platform === 'win32' && ['npx', 'npm'].includes(command)
      ? `${command}.cmd`
      : command;
  const result = spawnSync(executable, args, {
    cwd: options.cwd ?? cdkRoot,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: { ...process.env, ...options.env },
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`${command} exited with status ${result.status}.`);
  return result.stdout ?? '';
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
