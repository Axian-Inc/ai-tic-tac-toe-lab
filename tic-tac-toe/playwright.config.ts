import { defineConfig } from '@playwright/test';

const PORT = process.env.PORT ?? '4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `PORT=${PORT} BROWSER=none npm start`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
