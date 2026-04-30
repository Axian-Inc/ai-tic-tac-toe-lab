import { defineConfig, devices } from "@playwright/test";

const coverageEnabled = process.env.PLAYWRIGHT_COVERAGE === "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: coverageEnabled
    ? [
        ["list"],
        [
          "monocart-reporter",
          {
            name: "UI Code Coverage",
            outputFile: "./coverage/playwright-report.html",
            coverage: {
              name: "UI Code Coverage",
              all: {
                dir: "./src",
                filter: "**/*.{ts,tsx}",
              },
              entryFilter: (entry) => /\/src\/.*\.(ts|tsx)([?#].*)?$/.test(entry.url),
              outputDir: "./coverage",
              reports: [["v8", { inline: true }], "lcovonly", "console-summary"],
              sourceFilter: (sourcePath) => /^src\/.*\.(ts|tsx)$/.test(sourcePath),
              sourcePath: (filePath, info) => {
                const normalizedPath = filePath.replace(/\\/g, "/");
                const distFile = typeof info.distFile === "string" ? info.distFile.replace(/\\/g, "/") : "";
                const distSourcePath = distFile.match(/src\/.*\.(ts|tsx)([?#].*)?$/)?.[0];

                if (/^[^/]+\.(ts|tsx)$/.test(normalizedPath) && distSourcePath) {
                  return distSourcePath.replace(/[?#].*$/, "");
                }

                return normalizedPath.replace(/^.*\/src\//, "src/");
              },
            },
          },
        ],
      ]
    : undefined,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
