import { useEffect, useMemo, useRef, useState } from "react";
import { Game, type BoardCell, type GameState } from "./game/Game";

type RoutePath = "/" | "/game";

function resolveRoute(pathname: string): RoutePath {
  return pathname === "/game" ? "/game" : "/";
}

function LandingPage({ onStartGame }: { onStartGame: () => void }) {
  return (
    <main className="page page-landing">
      <div className="landing-decor landing-decor-left" aria-hidden="true">
        X
      </div>
      <div className="landing-decor landing-decor-right" aria-hidden="true">
        O
      </div>

      <section className="landing-content" aria-label="Game introduction">
        <p className="landing-brand">
          <span className="player-x">X</span>
          <span className="brand-divider">|</span>
          <span className="player-o">O</span>
        </p>
        <h1>Tic Tac Toe</h1>
        <p className="landing-intro">
          The classic game of X&apos;s and O&apos;s. Can you beat the CPU?
        </p>
        <button type="button" className="landing-cta" onClick={onStartGame}>
          Play vs CPU
        </button>

        <div className="landing-meta" aria-hidden="true">
          <div>
            <span className="meta-value player-x">X</span>
            <span className="meta-label">YOU</span>
          </div>
          <div>
            <span className="meta-value">VS</span>
            <span className="meta-label">BATTLE</span>
          </div>
          <div>
            <span className="meta-value player-o">O</span>
            <span className="meta-label">CPU</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function getCellLabel(cell: BoardCell): string {
  if (cell === "X") {
    return "X";
  }

  if (cell === "O") {
    return "O";
  }

  return "";
}

function getStatusMessage(gameState: GameState): string {
  if (gameState.status.isOver) {
    if (gameState.status.winner === "X") {
      return "Game over: You win!";
    }

    if (gameState.status.winner === "O") {
      return "Game over: CPU wins.";
    }

    return "Game over: It's a draw.";
  }

  return gameState.currentPlayer === "X" ? "Your turn (X)" : "CPU turn (O)";
}

const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Fixed ordering keeps equivalent-score choices deterministic.
const POSITION_PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function hasWinningLine(board: BoardCell[], player: "X" | "O"): boolean {
  return WINNING_LINES.some(
    ([a, b, c]) => board[a] === player && board[b] === player && board[c] === player
  );
}

function getAvailablePositions(board: BoardCell[]): number[] {
  return POSITION_PRIORITY.filter((position) => board[position] === null);
}

function scoreBoard(board: BoardCell[], depth: number): number | null {
  if (hasWinningLine(board, "O")) {
    return 10 - depth;
  }

  if (hasWinningLine(board, "X")) {
    return depth - 10;
  }

  if (board.every((cell) => cell !== null)) {
    return 0;
  }

  return null;
}

function minimax(board: BoardCell[], player: "X" | "O", depth: number): number {
  const score = scoreBoard(board, depth);

  if (score !== null) {
    return score;
  }

  const availablePositions = getAvailablePositions(board);

  if (player === "O") {
    // CPU maximizes score.
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const position of availablePositions) {
      board[position] = "O";
      const nextScore = minimax(board, "X", depth + 1);
      board[position] = null;
      bestScore = Math.max(bestScore, nextScore);
    }

    return bestScore;
  }

  // Human player minimizes score.
  let bestScore = Number.POSITIVE_INFINITY;

  for (const position of availablePositions) {
    board[position] = "X";
    const nextScore = minimax(board, "O", depth + 1);
    board[position] = null;
    bestScore = Math.min(bestScore, nextScore);
  }

  return bestScore;
}

function getCpuMovePosition(game: Game): number | null {
  const board = game.getBoard();
  const availablePositions = getAvailablePositions(board);

  if (availablePositions.length === 0) {
    return null;
  }

  let bestMove = availablePositions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const position of availablePositions) {
    if (!game.canPlaceMove(position)) {
      continue;
    }

    board[position] = "O";
    const moveScore = minimax(board, "X", 1);
    board[position] = null;

    // Strictly greater preserves first-in-order tie breaking.
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = position;
    }
  }

  return bestMove;
}

function GameplayPage() {
  const gameRef = useRef<Game>(new Game());
  const [gameState, setGameState] = useState<GameState>(() =>
    gameRef.current.getState()
  );
  const statusMessage = getStatusMessage(gameState);
  const isGameOver = gameState.status.isOver;
  const isXTurn = !isGameOver && gameState.currentPlayer === "X";
  const isOTurn = !isGameOver && gameState.currentPlayer === "O";

  const boardCells = useMemo(
    () =>
      gameState.board.map((cell, index) => ({
        cell,
        index,
        isInteractive:
          gameState.currentPlayer === "X" && gameRef.current.canPlaceMove(index),
      })),
    [gameState.board, gameState.currentPlayer]
  );

  const handleCellClick = (position: number) => {
    const didPlaceMove = gameRef.current.placeMove(position);

    if (didPlaceMove) {
      setGameState(gameRef.current.getState());
    }
  };

  useEffect(() => {
    if (gameState.status.isOver || gameState.currentPlayer !== "O") {
      return;
    }

    const cpuMovePosition = getCpuMovePosition(gameRef.current);

    if (cpuMovePosition === null) {
      return;
    }

    const didPlaceCpuMove = gameRef.current.placeMove(cpuMovePosition);

    if (didPlaceCpuMove) {
      setGameState(gameRef.current.getState());
    }
  }, [gameState.currentPlayer, gameState.status.isOver]);

  return (
    <main className="page page-gameplay" aria-label="Gameplay board">
      <section className="gameplay-shell">
        <h1 className="gameplay-title">
          <span className="title-x">Tic Tac</span>
          <span className="title-o">Toe</span>
        </h1>

        <div className="gameplay-players" aria-hidden="true">
          <p
            className={`player-indicator player-indicator-x ${isXTurn ? "player-indicator-active" : ""}`}
          >
            <span className="player-x">X</span>
            <span>You</span>
          </p>
          <p className="player-indicator player-indicator-vs">VS</p>
          <p
            className={`player-indicator player-indicator-o ${isOTurn ? "player-indicator-active" : ""}`}
          >
            <span className="player-o">O</span>
            <span>CPU</span>
          </p>
        </div>

        <p
          className={`gameplay-status ${isGameOver ? "gameplay-status-over" : "gameplay-status-active"}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>

        <section
          className={`game-board ${isGameOver ? "game-board-over" : ""}`}
          aria-label="Tic Tac Toe board"
        >
          {boardCells.map(({ cell, index, isInteractive }) => (
            <button
              type="button"
              key={index}
              className={`board-cell ${cell ? `board-cell-${cell.toLowerCase()}` : ""}`}
              onClick={() => handleCellClick(index)}
              disabled={!isInteractive}
              aria-label={`Cell ${index + 1}${cell ? `, marked ${cell}` : ""}`}
            >
              {getCellLabel(cell)}
            </button>
          ))}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() =>
    resolveRoute(window.location.pathname)
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRoute(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (path: RoutePath) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  if (route === "/game") {
    return <GameplayPage />;
  }

  return <LandingPage onStartGame={() => navigateTo("/game")} />;
}
