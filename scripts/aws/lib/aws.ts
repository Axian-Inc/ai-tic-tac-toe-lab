import { captureCommand } from "./command.js";

export function resolveStackOutput(
  stackName: string,
  region: string,
  outputKey: string,
): string {
  const outputValue = captureCommand("aws", [
    "cloudformation",
    "describe-stacks",
    "--region",
    region,
    "--stack-name",
    stackName,
    "--query",
    `Stacks[0].Outputs[?OutputKey=='${outputKey}'].OutputValue`,
    "--output",
    "text",
  ]);

  if (outputValue.length === 0 || outputValue === "None") {
    throw new Error(
      `could not resolve stack output '${outputKey}' from '${stackName}'.`,
    );
  }

  return outputValue;
}

export function resolveDefaultVpcId(region: string): string {
  const vpcId = captureCommand("aws", [
    "ec2",
    "describe-vpcs",
    "--region",
    region,
    "--filters",
    "Name=isDefault,Values=true",
    "--query",
    "Vpcs[0].VpcId",
    "--output",
    "text",
  ]);

  if (vpcId.length === 0 || vpcId === "None") {
    throw new Error(
      `no default VPC found in region '${region}'. Provide a default VPC or update the deployment scripts.`,
    );
  }

  return vpcId;
}

export function resolveDefaultSubnetId(region: string, vpcId: string): string {
  const subnetId = captureCommand("aws", [
    "ec2",
    "describe-subnets",
    "--region",
    region,
    "--filters",
    `Name=vpc-id,Values=${vpcId}`,
    "Name=default-for-az,Values=true",
    "--query",
    "Subnets[0].SubnetId",
    "--output",
    "text",
  ]);

  if (subnetId.length === 0 || subnetId === "None") {
    throw new Error(
      `no default subnet found in VPC '${vpcId}' for region '${region}'.`,
    );
  }

  return subnetId;
}
