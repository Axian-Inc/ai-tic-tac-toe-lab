import path from "node:path";

import { buildS3SyncArgs } from "./lib/aws-commands.js";
import { resolveStackOutput } from "./lib/aws.js";
import { requireCommand, runCommand } from "./lib/command.js";
import { loadDevConfig, repoRoot } from "./lib/config.js";
import { ensureDirectoryExists } from "./lib/fs.js";
import {
  createFrontendBuildEnvironment,
  resolveFrontendMultiplayerApiBaseUrl,
} from "./lib/frontend-deploy.js";
import { ensureProjectTaggedName } from "./lib/guards.js";

function main(): void {
  const config = loadDevConfig();
  const stackName = config.s3WebsiteStackName;
  const bucketName = config.s3WebsiteBucketName;
  const region = config.awsRegion;
  const buildDir = path.join(repoRoot, config.s3BuildDir);
  let multiplayerApiBaseUrl = config.s3MultiplayerApiBaseUrl;

  requireCommand("aws", "AWS CLI is required but not installed.");
  requireCommand("npm", "npm is required but not installed.");
  ensureProjectTaggedName(bucketName, "bucket name", config.projectTag);
  ensureProjectTaggedName(stackName, "stack name", config.projectTag);

  if (!multiplayerApiBaseUrl && config.s3MultiplayerStackName) {
    console.log(
      `Resolving multiplayer API base URL from stack '${config.s3MultiplayerStackName}' in region '${region}'...`,
    );
    multiplayerApiBaseUrl = resolveFrontendMultiplayerApiBaseUrl(
      config,
      resolveStackOutput,
    );
  }

  console.log("Building production bundle with 'npm run build'...");
  if (multiplayerApiBaseUrl) {
    console.log(
      `Injecting VITE_MULTIPLAYER_API_BASE_URL='${multiplayerApiBaseUrl}' into the frontend build...`,
    );
    runCommand("npm", ["run", "build"], {
      cwd: repoRoot,
      env: createFrontendBuildEnvironment(process.env, multiplayerApiBaseUrl),
    });
  } else {
    runCommand("npm", ["run", "build"], { cwd: repoRoot });
  }

  ensureDirectoryExists(buildDir);

  console.log(`Syncing '${config.s3BuildDir}' to s3://${bucketName} in region '${region}'...`);
  runCommand("aws", buildS3SyncArgs(buildDir, bucketName, region));

  const websiteUrl = `http://${bucketName}.s3-website-${region}.amazonaws.com`;

  console.log("Deployment complete.");
  console.log(`Bucket: ${bucketName}`);
  console.log(`Website URL: ${websiteUrl}`);
  if (multiplayerApiBaseUrl) {
    console.log(`Multiplayer API URL: ${multiplayerApiBaseUrl}`);
  }
}

main();
