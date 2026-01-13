# Response
Not currently. This repo has ESLint and Prettier configs (`.eslintrc.cjs`, `.prettierrc.json`), but `package.json` only defines test scripts and no `lint`/`format` scripts. So when we validate a story, only tests run unless we manually add or run lint/format commands.

If you want lint/format included in story validation, I can add scripts (e.g. `lint`, `format:check`) and start running them alongside tests.
