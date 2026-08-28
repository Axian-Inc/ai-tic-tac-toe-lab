import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const required = ['AWS_ACCOUNT_ID', 'AWS_REGION', 'DEPLOY_ENVIRONMENT'];
if (process.env.ENABLE_AWS_DEPLOYMENT !== 'true') {
  fail('Deployment is disabled. Set ENABLE_AWS_DEPLOYMENT=true only after approval.');
}
if (process.env.CONFIRM_AWS_DEPLOYMENT !== 'true') {
  fail('Set CONFIRM_AWS_DEPLOYMENT=true after confirming the target account, region, and change.');
}
for (const name of required) {
  if (!process.env[name]?.trim()) fail(`${name} is required.`);
}

const identity = run('aws', ['sts', 'get-caller-identity', '--output', 'json'], {
  capture: true,
});
const actualAccount = JSON.parse(identity).Account;
if (actualAccount !== process.env.AWS_ACCOUNT_ID) {
  fail(
    `AWS identity account ${actualAccount} does not match approved AWS_ACCOUNT_ID ${process.env.AWS_ACCOUNT_ID}.`,
  );
}

const outputDirectory = resolve('.deployment');
const outputFile = resolve(outputDirectory, 'cdk-outputs.json');
mkdirSync(outputDirectory, { recursive: true });

run('npx', [
  'cdk',
  'deploy',
  '--all',
  '--require-approval',
  'never',
  '--outputs-file',
  outputFile,
]);

const allOutputs = JSON.parse(readFileSync(outputFile, 'utf8'));
const [stackName, outputs] = Object.entries(allOutputs)[0] ?? [];
if (!stackName || !outputs) fail('CDK did not return stack outputs.');

const websiteUrl = outputs.WebsiteUrl ?? 'not returned';
const summary = [
  '### L&D deployment',
  `- Account: \`${actualAccount}\``,
  `- Region: \`${process.env.AWS_REGION}\``,
  `- Stack: \`${stackName}\``,
  `- Commit: \`${process.env.SOURCE_COMMIT ?? 'local'}\``,
  `- URL: ${websiteUrl}`,
  '',
].join('\n');

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
process.stdout.write(summary);

function run(command, args, options = {}) {
  const executable =
    process.platform === 'win32' && command === 'npx' ? 'npx.cmd' : command;
  const result = spawnSync(executable, args, {
    cwd: resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: process.env,
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`${command} exited with status ${result.status}.`);
  return result.stdout ?? '';
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
