import { resolveStackOutput } from "./aws.js";
import type { DevConfig } from "./config.js";
import { ensureProjectTaggedName } from "./guards.js";

export interface DeployedUrls {
  websiteUrl: string;
  backendBaseUrl: string;
}

export function resolveWebsiteUrl(
  config: DevConfig,
  resolver: typeof resolveStackOutput = resolveStackOutput,
): string {
  ensureProjectTaggedName(
    config.s3WebsiteStackName,
    "website stack name",
    config.projectTag,
  );

  return resolver(config.s3WebsiteStackName, config.awsRegion, "WebsiteURL");
}

export function resolveBackendBaseUrl(
  config: DevConfig,
  resolver: typeof resolveStackOutput = resolveStackOutput,
): string {
  if (config.s3MultiplayerApiBaseUrl) {
    return config.s3MultiplayerApiBaseUrl;
  }

  const stackName = config.s3MultiplayerStackName || config.multiplayerStackName;

  ensureProjectTaggedName(
    stackName,
    "multiplayer stack name",
    config.projectTag,
  );

  return resolver(stackName, config.awsRegion, "BackendBaseUrl");
}

export function resolveDeployedUrls(
  config: DevConfig,
  resolver: typeof resolveStackOutput = resolveStackOutput,
): DeployedUrls {
  return {
    websiteUrl: resolveWebsiteUrl(config, resolver),
    backendBaseUrl: resolveBackendBaseUrl(config, resolver),
  };
}
