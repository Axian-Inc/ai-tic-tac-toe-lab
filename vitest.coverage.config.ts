import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/server/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/features/game/model/**/*.ts', 'server/**/*.ts', 'shared/contracts/**/*.ts'],
      exclude: ['server/index.ts', '**/index.ts'],
    },
  },
});
