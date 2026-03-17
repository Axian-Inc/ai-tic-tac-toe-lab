# Coding Standards (Draft)
Date: 2026-02-05

## General
- Keep game logic pure and testable in the `Game` module.
- UI should not contain game rules beyond input validation and feedback.
- Deterministic CPU must be testable with fixed board states.
- UI must be automation-testable; ensure semantic elements and stable selectors where needed.

## Open Questions
- Preferred linting/formatting (ESLint/Prettier)?
- Naming conventions or folder structure preferences?

## Implementation Updates
Date: 2026-02-27
- Repository baseline uses ESLint v9 flat config (`eslint.config.js`) for TypeScript + React hooks rules.
- Prettier is configured via `.prettierrc.json`; run `npm run format` / `npm run format:check`.
- Standard npm validation scripts are `npm run test`, `npm run lint`, and `npm run build`.
