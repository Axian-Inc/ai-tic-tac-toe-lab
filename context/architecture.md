# Architecture

## System Overview
A static single-page web app served from S3. All game logic runs in the browser with no backend services.

## Components
### UI Layer
- **Responsibility**: Render the board, controls, status, and win/celebration visuals.
- **Technology**: HTML/CSS with minimal JS DOM updates.
- **Interfaces**: Calls game controller functions, listens to user input.

### Game Logic
- **Responsibility**: Track board state, validate moves, detect wins/ties.
- **Technology**: JavaScript module functions.
- **Interfaces**: Exposes state update functions, provides win/tie results.

### AI Engine
- **Responsibility**: Provide opponent moves based on selected style.
- **Technology**: JavaScript module functions.
- **Interfaces**: Accepts board state, returns next move index.
- **Styles**: Random and optimal (minimax).

## Data Flow
User input -> UI -> Game Logic -> (if AI turn) AI Engine -> Game Logic -> UI update.

## External Integrations
None.

## Key Design Decisions
- **Static-only deployment**: Simplifies hosting and keeps scope minimal.
- **Vanilla JS modules**: Minimizes dependencies for a small POC.
