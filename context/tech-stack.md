# Tech Stack

Last updated: 2026-03-09

## Phase 1

### Frontend
- React 18
- TypeScript 5
- Vite 5

### Runtime and Package Manager
- Node.js 20
- npm 10

### Infrastructure Tooling
- AWS CloudFormation (template-based infrastructure provisioning)
- AWS CLI v2 (stack deployment and output inspection)

### Notes
- This stack supports local development and AWS S3 static website hosting for browser-based Tic-Tac-Toe.

## Phase 2

### Planned Additions
- Node.js backend service for multiplayer HTTP and websocket handling.
- Reuse of TypeScript across frontend and backend to keep game-rule types aligned.
- AWS infrastructure additions remain constrained to low-cost services and should be captured in IaC before implementation is treated as complete.

### Selection Constraints
- Avoid introducing auth, database, or infrastructure dependencies that exceed the documented low-cost Phase 2 scope unless context is updated first.
- Prefer a backend approach that allows the existing browser client to remain a static S3 deployment while connecting to a separate multiplayer API endpoint.
