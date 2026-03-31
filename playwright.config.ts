import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: [
    {
      command: 'PORT=8788 npm run start:server',
      port: 8788,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'VITE_API_ORIGIN=http://127.0.0.1:8788 npm run dev -- --host 127.0.0.1 --port 4173',
      port: 4173,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
