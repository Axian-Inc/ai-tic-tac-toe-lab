const FRONTEND_PORT = 4173;
const BACKEND_PORT = 3001;
const DEFAULT_REMOTE_CDP_ENDPOINT = "http://host.docker.internal:9222";

export type UiAutomationMode = "frontend" | "full";
export type UiAutomationBrowserTarget = "Local" | "RemoteCDP";

export interface UiAutomationRuntimeConfig {
  baseURL: string;
  browserTarget: UiAutomationBrowserTarget;
  mode: UiAutomationMode;
  multiplayerApiBaseUrl: string | null;
  remoteCdpEndpoint: string | null;
  webServers: Array<{
    command: string;
    port: number;
    reuseExistingServer: boolean;
    timeout: number;
  }>;
  workers: number | undefined;
}

function resolveUiAutomationMode(): UiAutomationMode {
  return process.env.UI_AUTOMATION_MODE === "full" ? "full" : "frontend";
}

function resolveUiAutomationBrowserTarget(): UiAutomationBrowserTarget {
  return process.env.UI_AUTOMATION_BROWSER_TARGET === "RemoteCDP"
    ? "RemoteCDP"
    : "Local";
}

function resolveRemoteBrowserHostAddress(): string {
  return process.env.UI_AUTOMATION_REMOTE_BROWSER_HOST?.trim() || "localhost";
}

export function isUnitOnlyRun(argv: string[]): boolean {
  const positionalArgs = argv
    .slice(2)
    .filter((arg) => arg !== "test" && !arg.startsWith("-"));

  return (
    positionalArgs.length > 0 &&
    positionalArgs.every((arg) => arg.startsWith("tests/unit"))
  );
}

export function getUiAutomationRuntimeConfig(
  argv: string[]
): UiAutomationRuntimeConfig {
  const mode = resolveUiAutomationMode();
  const browserTarget = resolveUiAutomationBrowserTarget();
  const remoteBrowserHostAddress = resolveRemoteBrowserHostAddress();
  const baseURL =
    process.env.UI_AUTOMATION_BASE_URL?.trim() ||
    (browserTarget === "RemoteCDP"
      ? `http://${remoteBrowserHostAddress}:${FRONTEND_PORT}`
      : `http://127.0.0.1:${FRONTEND_PORT}`);
  const multiplayerApiBaseUrl =
    process.env.UI_AUTOMATION_MULTIPLAYER_API_BASE_URL?.trim() ||
    (browserTarget === "RemoteCDP" && mode === "full"
      ? `http://${remoteBrowserHostAddress}:${BACKEND_PORT}`
      : null);
  const reuseExistingServer = !process.env.CI;
  const remoteCdpEndpoint =
    browserTarget === "RemoteCDP"
      ? process.env.UI_AUTOMATION_REMOTE_CDP_ENDPOINT?.trim() ||
        DEFAULT_REMOTE_CDP_ENDPOINT
      : null;
  const workers = browserTarget === "RemoteCDP" || mode === "full" ? 1 : undefined;
  const frontendHost = browserTarget === "RemoteCDP" ? "0.0.0.0" : "127.0.0.1";

  if (isUnitOnlyRun(argv)) {
    return {
      baseURL,
      browserTarget,
      mode,
      multiplayerApiBaseUrl,
      remoteCdpEndpoint,
      webServers: [],
      workers,
    };
  }

  const frontendCommandPrefix = multiplayerApiBaseUrl
    ? `VITE_MULTIPLAYER_API_BASE_URL=${multiplayerApiBaseUrl} `
    : "";
  const webServers: UiAutomationRuntimeConfig["webServers"] = [
    {
      command: `${frontendCommandPrefix}npm run dev -- --host ${frontendHost} --port ${FRONTEND_PORT}`,
      port: FRONTEND_PORT,
      reuseExistingServer,
      timeout: 120 * 1000,
    },
  ];

  if (mode === "full") {
    webServers.push({
      command: "npm run server:start:automation",
      port: BACKEND_PORT,
      reuseExistingServer,
      timeout: 120 * 1000,
    });
  }

  return {
    baseURL,
    browserTarget,
    mode,
    multiplayerApiBaseUrl,
    remoteCdpEndpoint,
    webServers,
    workers,
  };
}
