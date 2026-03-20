import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173";
const reportPrefix = process.env.TEST_REPORT_PREFIX ?? "ui";
const reportTimestamp =
  process.env.TEST_REPORT_TIMESTAMP ?? new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const reportBase = `${reportPrefix}-${reportTimestamp}`;

export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"], ["html", { open: "never", outputFolder: `playwright-report/${reportBase}-html` }]],
  outputDir: `playwright-report/${reportBase}-results`,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
