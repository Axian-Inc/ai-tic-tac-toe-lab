# Architecture

Date: 2026-03-18

Overview:
- Single-page React app with two views: landing and game.
- Game state managed in App component and passed to GamePage.
- UI components: Board and Square render the grid.

Data Flow:
- App owns game state and view routing.
- GamePage handles gameplay events and passes selections back up.
