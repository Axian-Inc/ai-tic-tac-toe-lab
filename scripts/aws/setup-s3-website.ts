import path from "node:path";

import { buildCloudFormationDeployArgs } from "./lib/aws-commands.js";
import { resolveStackOutput } from "./lib/aws.js";
import { requireCommand, runCommand } from "./lib/command.js";
import { loadDevConfig, repoRoot } from "./lib/config.js";
import { ensureFileExists } from "./lib/fs.js";
import { ensureProjectTaggedName } from "./lib/guards.js";

function main(): void {
  const config = loadDevConfig();
  const stackName = config.s3WebsiteStackName;
  const bucketName = config.s3WebsiteBucketName;
  const region = config.awsRegion;
  const templatePath = path.join(repoRoot, "infra/s3-static-website.yaml");

  ensureProjectTaggedName(bucketName, "bucket name", config.projectTag);
  ensureProjectTaggedName(stackName, "stack name", config.projectTag);
  requireCommand("aws", "AWS CLI is required but not installed.");
  ensureFileExists(templatePath);

  console.log(
    `Deploying stack '${stackName}' in region '${region}' with bucket '${bucketName}'...`,
  );

  runCommand(
    "aws",
    buildCloudFormationDeployArgs({
      region,
      stackName,
      templatePath,
      parameterOverrides: [`BucketName=${bucketName}`],
    }),
  );

  const websiteUrl = resolveStackOutput(stackName, region, "WebsiteURL");

  console.log("Deployment complete.");
  console.log(`Website URL: ${websiteUrl}`);
}

main();
