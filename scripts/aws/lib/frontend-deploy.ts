import { resolveStackOutput } from "./aws.js";
import type { DevConfig } from "./config.js";
import { ensureProjectTaggedName } from "./guards.js";

export function resolveFrontendMultiplayerApiBaseUrl(
  config: DevConfig,
  resolver: typeof resolveStackOutput = resolveStackOutput,
): string {
  if (config.s3MultiplayerApiBaseUrl) {
    return config.s3MultiplayerApiBaseUrl;
  }

  if (!config.s3MultiplayerStackName) {
    return "";
  }

  ensureProjectTaggedName(
    config.s3MultiplayerStackName,
    "multiplayer stack name",
    config.projectTag,
  );

  return resolver(
    config.s3MultiplayerStackName,
    config.awsRegion,
    "BackendBaseUrl",
  );
}

export function createFrontendBuildEnvironment(
  baseEnv: NodeJS.ProcessEnv,
  multiplayerApiBaseUrl: string,
): NodeJS.ProcessEnv {
  if (!multiplayerApiBaseUrl) {
    return { ...baseEnv };
  }

  return {
    ...baseEnv,
    VITE_MULTIPLAYER_API_BASE_URL: multiplayerApiBaseUrl,
  };
}
