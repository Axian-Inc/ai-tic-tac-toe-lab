# Tech Stack
Date: 2026-02-27

## Application Baseline (Implemented)
- React + React DOM
- TypeScript
- Vite + `@vitejs/plugin-react`
- Tailwind CSS + `@tailwindcss/vite`
- ESLint (v9 flat config) + `@typescript-eslint` + `eslint-plugin-react-hooks`
- Prettier

## Additional Project Tooling
- Terraform for IaC (`infra/terraform`)
- AWS S3 + CloudFront for static hosting

## Pending Decisions
- E2E test implementation details (Playwright story implementation pending)
- Audio/confetti library selection

## Updates
Date: 2026-03-17
- Added Vitest as the unit-test runner for game-module logic.
- Standard validation scripts now include `npm run test` for unit coverage alongside `npm run lint`, `npm run build`, and `npm run format:check`.
