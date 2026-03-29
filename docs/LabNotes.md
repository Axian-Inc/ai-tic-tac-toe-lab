# Lab Notes

## Repository

- Git URL: `https://github.com/Axian-Inc/ai-tic-tac-toe-lab.git`

## Project Docs

The documentation is intentionally split into two groups:

- `docs/`
  Human-readable, current-state project documentation
- `context/`
  Project planning, historical decisions, and AI-agent-oriented context

Human-readable / current-state docs in `docs/`:

- Main docs: [README.md](README.md)
- Quickstart: [QUICKSTART.md](QUICKSTART.md)
- Testing guide: [testing.md](testing.md)
- Frontend/backend integration: [integration.md](integration.md)
- Deployment operations: [deployment-operations.md](deployment-operations.md)

Project planning / AI-centric context in `context/`:

- Context index: [../context/README.md](../context/README.md)
- Historical API design: [../context/api-design.md](../context/api-design.md)
- Current API implementation reference: [../context/api-implementation.md](../context/api-implementation.md)
- Roadmap: [../context/roadmap.md](../context/roadmap.md)
- Decisions: [../context/decisions.md](../context/decisions.md)

## User Stories / AI Input

This project was developed in two different prompt/context phases.

Phase 1:

- Phase 1 was driven by the prompt set in [../context/OriginalPrompts](../context/OriginalPrompts).
- Those prompts were created by first feeding project requirements into ChatGPT, then using the resulting prompts as the work packets given to Codex.
- That phase covered the original single-player application foundation and early project scaffolding work.

Phase 2 and beyond:

- After Phase 1, I found that the lack of sustainable context, especially across work sessions, made it harder to maintain momentum and continuity.
- At that point I shifted to a memory-bank-style structure in `context/` and started adding durable project-reference documents there.
- That later structure is what the project used for roadmap tracking, architectural decisions, API documentation, and implementation-state references.

High-level story areas the project was structured around:

- Single-player Tic Tac Toe against a deterministic CPU opponent
- Multiplayer create, join, spectate, and replay flows
- Live multiplayer updates over WebSockets
- Coverage reporting for frontend and backend tests
- Pull-request validation workflow in GitHub Actions
- AWS deployment with Terraform-managed frontend and backend infrastructure

## Build And Test Commands

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npm run test:e2e:install
```

Build frontend:

```bash
npm run build
```

Build backend:

```bash
npm run build:backend
```

Run frontend unit tests:

```bash
npm test
```

Run backend tests:

```bash
npm run test:backend
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run frontend and backend coverage:

```bash
npm run coverage
```

Run PR-equivalent local validation:

```bash
npm run build
npm run build:backend
npm run test:unit:report
npm run test:backend:report
npm run coverage
```

## URLs

- Web app: `https://d8x7b0d4fceuf.cloudfront.net`
- Server HTTP API: `https://uci1lw31h7.execute-api.us-west-2.amazonaws.com/`
- Server WebSocket API: `wss://piouawdqu0.execute-api.us-west-2.amazonaws.com/prod`


