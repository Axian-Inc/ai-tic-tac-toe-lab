import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const positionalArgs = process.argv
  .slice(2)
  .filter((arg) => arg !== "test" && !arg.startsWith("-"));
const isUnitOnlyRun =
  positionalArgs.length > 0 &&
  positionalArgs.every((arg) => arg.startsWith("tests/unit"));

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    testIdAttribute: "data-testid",
  },
  webServer: isUnitOnlyRun
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
