# Coding Standards

## General
- Prefer small, focused modules.
- Keep domain logic free of React imports.
- Use TypeScript strict typing.

## React
- Functional components only.
- Keep UI state minimal; defer game rules to domain.
- Use `data-testid` for E2E selectors.

## Testing
- Unit tests should be deterministic.
- E2E tests should avoid timing hacks; use Playwright locators/expect.
- Document test-only behavior (e.g., `cpu=off`).

## Styling
- Use existing CSS structure (`src/index.css`).
- Avoid introducing heavy dependencies for effects.
