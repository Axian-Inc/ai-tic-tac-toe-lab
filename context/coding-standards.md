# Coding Standards

## General Principles
- Keep functions small and single-purpose.
- Prefer pure functions for game logic and AI.
- Avoid global state; contain state in a game controller module.

## Naming Conventions
- **Files**: kebab-case (e.g., `game-logic.js`).
- **Variables**: camelCase.
- **Functions**: camelCase verbs.

## File Organization
- `index.html` at the root; `src/` contains JS/CSS (`src/main.js`, `src/styles.css`).
- Logic split into modules if size warrants.

## Error Handling
- Guard against invalid moves and ignore clicks when game is over.

## Comments & Documentation
- Add brief comments only for non-obvious logic (e.g., AI move selection).

## Forbidden Patterns
- No external runtime dependencies.
- No inline JS in HTML.
