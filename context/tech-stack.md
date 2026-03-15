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
- Playwright (installed and configured as of 2026-03-08)
- Node.js built-in test runner + TypeScript compile step for unit tests (`npm run test:unit`) as of 2026-03-15

## Pending Decisions
- E2E test implementation details (Playwright story implementation pending)
- Audio/confetti library selection
