# Response
Added Vitest coverage reporting and updated the testing process to always emit coverage on test runs. Updated `vitest.config.ts` with coverage settings, adjusted test scripts to include `--coverage`, added `@vitest/coverage-v8`, and documented the coverage output in `context/testing-strategy.md`. Also added `coverage/` to `.gitignore`.

Next steps:
1) Run `npm install` to update `package-lock.json` with the new dev dependency.
2) Run `npm test` to generate the coverage report in `coverage/`.
