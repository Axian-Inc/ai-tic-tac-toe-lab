import { defineConfig, devices } from "@playwright/test";
import { getUiAutomationRuntimeConfig } from "./tests/playwright/runtime";

const runtime = getUiAutomationRuntimeConfig(process.argv);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  outputDir: "test-results/playwright/artifacts",
  reporter: [
    ["list"],
    ["junit", { outputFile: "test-results/playwright/junit.xml" }],
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
