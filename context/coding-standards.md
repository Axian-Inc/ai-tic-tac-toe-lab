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
