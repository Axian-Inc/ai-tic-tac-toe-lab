# Response
Added a minimal Vitest + TypeScript setup to run the shared schema tests, wiring scripts and config for a Node test environment. Config and scripts are in `package.json`, `tsconfig.json`, and `vitest.config.ts` to match the current `src/**/__tests__` layout.

- Tests not run (dependencies not installed yet).

Next steps:
1) Install dependencies with `pnpm install` (or `npm install`).
2) Run the tests with `pnpm test` (or `npm test`).
