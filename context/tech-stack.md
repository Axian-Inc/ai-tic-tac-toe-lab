# Tech Stack

Last updated: 2026-03-21

## Frontend
- React 18
- TypeScript 5
- Vite 5

## Runtime and Package Manager
- Node.js 20
- npm 10

## Testing Tooling
- Vitest 4
- `@vitest/coverage-v8`
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Playwright 1.58

## Infrastructure Tooling
- AWS CloudFormation (template-based infrastructure provisioning)
- AWS CLI v2 (stack deployment and output inspection)

## Notes
- This stack supports local development and AWS S3 static website hosting for browser-based Tic-Tac-Toe.
- Testing stack supports both fast local unit feedback and browser-level UI automation from the same npm workflow.
