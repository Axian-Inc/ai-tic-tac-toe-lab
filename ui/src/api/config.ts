type RuntimeApiConfig = {
  __TICTACTOE_API_HTTP_URL__?: string;
  __TICTACTOE_API_WS_URL__?: string;
  process?: {
    env?: Record<string, string | undefined>;
  };
};

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

const readEnvValue = (key: "VITE_API_HTTP_URL" | "VITE_API_WS_URL"): string | undefined => {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  if (viteEnv?.[key]) {
    return viteEnv[key];
  }

  const runtimeConfig = globalThis as RuntimeApiConfig;
  const runtimeKey =
    key === "VITE_API_HTTP_URL" ? "__TICTACTOE_API_HTTP_URL__" : "__TICTACTOE_API_WS_URL__";

  return runtimeConfig[runtimeKey] ?? runtimeConfig.process?.env?.[key];
};

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

export const getApiHttpUrl = (): string => {
  const value = readEnvValue("VITE_API_HTTP_URL")?.trim();

  if (!value) {
    throw new ApiConfigurationError(
      "Online multiplayer is not configured. Set VITE_API_HTTP_URL before using online mode.",
    );
  }

  return stripTrailingSlashes(value);
};

export const getApiWsUrl = (): string => {
  const value = readEnvValue("VITE_API_WS_URL")?.trim();

  if (!value) {
    throw new ApiConfigurationError(
      "Online multiplayer is not configured. Set VITE_API_WS_URL before using online mode.",
    );
  }

  return value;
};
