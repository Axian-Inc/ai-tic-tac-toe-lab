import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root: repositoryRoot,
  resolve: {
    alias: {
      '@tic-tac-toe/game-core': fileURLToPath(
        new URL('../../packages/game-core/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/src/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/unit/src/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'packages/game-core/src/**/*.ts',
        'apps/web/src/**/*.{ts,tsx}',
      ],
      exclude: ['apps/web/src/main.tsx'],
      reporter: ['text', 'json', 'lcov', 'html'],
      reportsDirectory: 'coverage/quality-unit',
    },
  },
});
