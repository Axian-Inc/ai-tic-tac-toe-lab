import { defineConfig, devices } from "@playwright/test";

const baseURL = "https://dh0s8gqynjyz6.cloudfront.net";
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
    chromiumSandbox: false,
    launchOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
