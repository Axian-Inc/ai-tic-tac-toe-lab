# Architecture

Date: 2026-03-19

Overview:
- Single-page React app with two views: landing and game.
- Game state managed in App component and passed to GamePage.
- UI components: Board and Square render the grid.
- Infrastructure lives in `/terraform` and provisions AWS S3 static website hosting.
- Deployment scripts in `/scripts` build the app, read Terraform outputs, sync `dist/` to S3, and validate the hosted site.

Data Flow:
- App owns game state and view routing.
- GamePage handles gameplay events and passes selections back up.
- Terraform must run in the `stanb` workspace; a workspace guard blocks plans in `default`.
