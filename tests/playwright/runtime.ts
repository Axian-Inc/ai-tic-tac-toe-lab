const FRONTEND_PORT = 4173;
const BACKEND_PORT = 3001;

export type UiAutomationMode = "frontend" | "full";

export interface UiAutomationRuntimeConfig {
  baseURL: string;
  mode: UiAutomationMode;
  webServers: Array<{
    command: string;
    port: number;
    reuseExistingServer: boolean;
    timeout: number;
  }>;
}

function resolveUiAutomationMode(): UiAutomationMode {
  return process.env.UI_AUTOMATION_MODE === "full" ? "full" : "frontend";
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
  const baseURL = `http://127.0.0.1:${FRONTEND_PORT}`;
  const reuseExistingServer = !process.env.CI;

  if (isUnitOnlyRun(argv)) {
    return {
      baseURL,
      mode,
      webServers: [],
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
    mode,
    webServers,
  };
}
