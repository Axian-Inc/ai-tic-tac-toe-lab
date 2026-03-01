import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
const CONFETTI_INDICES = Array.from({ length: 26 }, (_, index) => index);

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

function GameplayPage({ onHome }: { onHome: () => void }) {
  const gameRef = useRef<Game>(new Game());
  const audioContextRef = useRef<AudioContext | null>(null);
  const confettiTimerRef = useRef<number | null>(null);
  const previousGameOverRef = useRef<boolean>(false);
  const [gameState, setGameState] = useState<GameState>(() =>
    gameRef.current.getState()
  );
  const [isConfettiVisible, setIsConfettiVisible] = useState<boolean>(false);
  const [confettiBurstId, setConfettiBurstId] = useState<number>(0);
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
          !gameState.status.isOver &&
          gameState.currentPlayer === "X" &&
          gameRef.current.canPlaceMove(index),
      })),
    [gameState.board, gameState.currentPlayer, gameState.status.isOver]
  );

  const ensureAudioContext = (): AudioContext => {
    if (audioContextRef.current === null) {
      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  };

  const clearConfettiTimer = () => {
    if (confettiTimerRef.current !== null) {
      window.clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = null;
    }
  };

  const triggerConfetti = () => {
    clearConfettiTimer();
    setConfettiBurstId((current) => current + 1);
    setIsConfettiVisible(true);
    confettiTimerRef.current = window.setTimeout(() => {
      setIsConfettiVisible(false);
      confettiTimerRef.current = null;
    }, 2200);
  };

  const playMoveThud = () => {
    const audioContext = ensureAudioContext();

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(135, now);
    oscillator.frequency.exponentialRampToValueAtTime(65, now + 0.1);

    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(480, now);
    filterNode.Q.setValueAtTime(0.8, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.16);
  };

  const playWinningSound = () => {
    const audioContext = ensureAudioContext();

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99];
    frequencies.forEach((frequency, index) => {
      const startTime = now + index * 0.09;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.06,
        startTime + 0.14
      );

      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.21);
    });
  };

  const playLosingSound = () => {
    const audioContext = ensureAudioContext();

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(210, now);
    oscillator.frequency.exponentialRampToValueAtTime(90, now + 0.34);

    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(680, now);
    filterNode.Q.setValueAtTime(0.7, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  };

  const handleCellClick = (position: number) => {
    if (!gameRef.current.canPlaceMove(position)) {
      return;
    }

    const didPlaceMove = gameRef.current.placeMove(position);

    if (didPlaceMove) {
      playMoveThud();
      setGameState(gameRef.current.getState());
    }
  };

  const handlePlayAgain = () => {
    clearConfettiTimer();
    setIsConfettiVisible(false);
    gameRef.current = new Game();
    setGameState(gameRef.current.getState());
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
      playMoveThud();
      setGameState(gameRef.current.getState());
    }
  }, [gameState.currentPlayer, gameState.status.isOver]);

  useEffect(() => {
    if (!previousGameOverRef.current && gameState.status.isOver) {
      if (gameState.status.winner !== null) {
        triggerConfetti();
      }

      if (gameState.status.winner === "X") {
        playWinningSound();
      } else if (gameState.status.winner === "O") {
        playLosingSound();
      }
    }

    previousGameOverRef.current = gameState.status.isOver;
  }, [gameState.status.isOver, gameState.status.winner]);

  useEffect(() => {
    return () => {
      clearConfettiTimer();
      if (audioContextRef.current !== null) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return (
    <main className="page page-gameplay" aria-label="Gameplay board">
      <section className="gameplay-shell">
        {isConfettiVisible ? (
          <div className="confetti-layer" aria-hidden="true" key={confettiBurstId}>
            {CONFETTI_INDICES.map((index) => {
              const style = {
                left: `${4 + ((index * 11) % 90)}%`,
                animationDelay: `${(index % 7) * 55}ms`,
              } as CSSProperties;

              return (
                <span
                  key={index}
                  className={`confetti-piece confetti-piece-color-${index % 4} ${index % 2 === 0 ? "confetti-piece-right" : "confetti-piece-left"}`}
                  style={style}
                />
              );
            })}
          </div>
        ) : null}

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
        {isGameOver && gameState.status.winner === "O" ? (
          <p className="gameplay-loss-feedback">Try again.</p>
        ) : null}

        <section
          className={`game-board ${isGameOver ? "game-board-over" : ""}`}
          aria-label="Tic Tac Toe board"
        >
          {boardCells.map(({ cell, index, isInteractive }) => (
            <button
              type="button"
              key={index}
              className={`board-cell ${isInteractive ? "board-cell-available" : "board-cell-blocked"} ${cell ? `board-cell-${cell.toLowerCase()}` : ""}`}
              onClick={() => handleCellClick(index)}
              disabled={!isInteractive}
              aria-label={`Cell ${index + 1}${cell ? `, marked ${cell}` : ""}${!isInteractive ? ", unavailable" : ", available"}`}
            >
              {getCellLabel(cell)}
            </button>
          ))}
        </section>

        <div className="gameplay-controls">
          {isGameOver ? (
            <button
              type="button"
              className="gameplay-control gameplay-control-primary"
              onClick={handlePlayAgain}
            >
              Play Again
            </button>
          ) : null}
          <button
            type="button"
            className="gameplay-control gameplay-control-secondary"
            onClick={onHome}
          >
            Home
          </button>
        </div>
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
    return <GameplayPage onHome={() => navigateTo("/")} />;
  }

  return <LandingPage onStartGame={() => navigateTo("/game")} />;
}
