import { defineConfig, devices } from "@playwright/test";
import { getUiAutomationRuntimeConfig } from "./tests/playwright/runtime";

const runtime = getUiAutomationRuntimeConfig(process.argv);

process.env.PLAYWRIGHT_JUNIT_SUITE_NAME ??= "tic-tac-toe";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: runtime.mode !== "full",
  retries: 0,
  workers: runtime.workers,
  outputDir: "test-results/playwright/artifacts",
  reporter: [
    ["list"],
    [
      "./tests/playwright/reporters/junit-with-steps.ts",
      { outputFile: "test-results/playwright/junit.xml" },
    ],
  ],
  use: {
    baseURL: runtime.baseURL,
    trace: "on-first-retry",
    testIdAttribute: "data-testid",
  },
  webServer: runtime.webServers.length > 0 ? runtime.webServers : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
