import path from "node:path";

import { buildCloudFormationDeployArgs } from "./lib/aws-commands.js";
import { resolveDefaultSubnetId, resolveDefaultVpcId, resolveStackOutput } from "./lib/aws.js";
import { requireCommand, runCommand } from "./lib/command.js";
import { loadDevConfig, repoRoot } from "./lib/config.js";
import { ensureFileExists } from "./lib/fs.js";
import { ensureProjectTaggedName } from "./lib/guards.js";

function main(): void {
  const config = loadDevConfig();
  const stackName = config.multiplayerStackName;
  const region = config.awsRegion;
  const instanceType = config.multiplayerInstanceType;
  const servicePort = config.multiplayerServicePort;
  const healthPath = config.multiplayerHealthPath;
  const readinessPath = config.multiplayerReadinessPath;
  const templatePath = path.join(repoRoot, "infra/multiplayer-service-foundation.yaml");

  ensureProjectTaggedName(stackName, "stack name", config.projectTag);
  requireCommand("aws", "AWS CLI is required but not installed.");
  ensureFileExists(templatePath);

  const vpcId = resolveDefaultVpcId(region);
  const subnetId = resolveDefaultSubnetId(region, vpcId);

  console.log(`Deploying multiplayer infrastructure stack '${stackName}' in region '${region}'...`);
  console.log(`Using default VPC '${vpcId}' and subnet '${subnetId}'.`);

  runCommand(
    "aws",
    buildCloudFormationDeployArgs({
      region,
      stackName,
      templatePath,
      capabilities: ["CAPABILITY_NAMED_IAM"],
      parameterOverrides: [
        `ProjectTag=${config.projectTag}`,
        `VpcId=${vpcId}`,
        `SubnetId=${subnetId}`,
        `InstanceType=${instanceType}`,
        `ServicePort=${servicePort}`,
        `HealthPath=${healthPath}`,
        `ReadinessPath=${readinessPath}`,
      ],
    }),
  );

  console.log("Infrastructure deployment complete.");
  console.log(
    `Deployment bucket: ${resolveStackOutput(stackName, region, "DeploymentBucketName")}`,
  );
  console.log(`Backend base URL: ${resolveStackOutput(stackName, region, "BackendBaseUrl")}`);
  console.log(
    `Backend health URL: ${resolveStackOutput(stackName, region, "BackendHealthUrl")}`,
  );
  console.log(
    `Backend readiness URL: ${resolveStackOutput(stackName, region, "BackendReadinessUrl")}`,
  );
}

main();
