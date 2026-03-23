# Tech Stack

Last updated: 2026-03-23

### Frontend
- React 18
- TypeScript 5
- Vite 7

### Runtime and Package Manager
- Node.js 20
- npm 10

## Testing Tooling
- Vitest 4
- `@vitest/coverage-v8`
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Playwright 1.58

## Testing Tooling
- Vitest 4
- `@vitest/coverage-v8`
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Playwright 1.58

### Infrastructure Tooling
- AWS CloudFormation (template-based infrastructure provisioning)
- AWS CLI v2 (stack deployment and output inspection)
- AWS EC2 (single-instance multiplayer runtime for low-cost Phase 2 hosting)
- AWS Systems Manager Run Command (backend release automation)
- AWS S3 (static frontend hosting and versioned backend release bundles)

### Notes
- This stack supports local development and AWS S3 static website hosting for browser-based Tic-Tac-Toe.
- Testing stack supports both fast local unit feedback and browser-level UI automation from the same npm workflow.

## Phase 2

### Planned Additions
- Node.js backend service for multiplayer HTTP and websocket handling.
- Reuse of TypeScript across frontend and backend to keep game-rule types aligned.
- AWS infrastructure additions remain constrained to low-cost services and should be captured in IaC before implementation is treated as complete.

### Implemented Foundation
- Phase 2 backend foundation currently uses Express on Node.js for HTTP service routing.
- Shared Tic-Tac-Toe domain logic is implemented once in `src/shared/game.ts` and reused by both runtimes.
- Deployable Phase 2 infrastructure now uses one public EC2 instance plus Systems Manager-driven release automation instead of adding a database, load balancer, or separate websocket service for the documented 25-game cap.

### Selection Constraints
- Avoid introducing auth, database, or infrastructure dependencies that exceed the documented low-cost Phase 2 scope unless context is updated first.
- Prefer a backend approach that allows the existing browser client to remain a static S3 deployment while connecting to a separate multiplayer API endpoint.
- Testing stack supports both fast local unit feedback and browser-level UI automation from the same npm workflow.
