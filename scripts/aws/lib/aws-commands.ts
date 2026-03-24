export function buildCloudFormationDeployArgs(options: {
  region: string;
  stackName: string;
  templatePath: string;
  capabilities?: string[];
  parameterOverrides?: string[];
}): string[] {
  const args = [
    "cloudformation",
    "deploy",
    "--region",
    options.region,
    "--stack-name",
    options.stackName,
    "--template-file",
    options.templatePath,
  ];

  if (options.capabilities && options.capabilities.length > 0) {
    args.push("--capabilities", ...options.capabilities);
  }

  if (options.parameterOverrides && options.parameterOverrides.length > 0) {
    args.push("--parameter-overrides", ...options.parameterOverrides);
  }

  args.push("--no-fail-on-empty-changeset");

  return args;
}

export function buildS3SyncArgs(
  buildDir: string,
  bucketName: string,
  region: string,
): string[] {
  return [
    "s3",
    "sync",
    buildDir,
    `s3://${bucketName}`,
    "--region",
    region,
    "--delete",
  ];
}
