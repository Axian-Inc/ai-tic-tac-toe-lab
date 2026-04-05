const FRONTEND_PORT = 4173;
const BACKEND_PORT = 3001;
const DEFAULT_REMOTE_CDP_ENDPOINT = "http://host.docker.internal:9222";

export type UiAutomationMode = "frontend" | "full";
export type UiAutomationBrowserTarget = "Local" | "RemoteCDP";

export interface UiAutomationRuntimeConfig {
  baseURL: string;
  browserTarget: UiAutomationBrowserTarget;
  mode: UiAutomationMode;
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
  const baseURL =
    process.env.UI_AUTOMATION_BASE_URL?.trim() ||
    `http://127.0.0.1:${FRONTEND_PORT}`;
  const reuseExistingServer = !process.env.CI;
  const remoteCdpEndpoint =
    browserTarget === "RemoteCDP"
      ? process.env.UI_AUTOMATION_REMOTE_CDP_ENDPOINT?.trim() ||
        DEFAULT_REMOTE_CDP_ENDPOINT
      : null;
  const workers = browserTarget === "RemoteCDP" || mode === "full" ? 1 : undefined;

  if (isUnitOnlyRun(argv)) {
    return {
      baseURL,
      browserTarget,
      mode,
      remoteCdpEndpoint,
      webServers: [],
      workers,
    };
  }

  const webServers: UiAutomationRuntimeConfig["webServers"] = [
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT}`,
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
    remoteCdpEndpoint,
    webServers,
    workers,
  };
}
