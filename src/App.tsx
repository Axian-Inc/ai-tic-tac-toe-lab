import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Game, type BoardCell, type GameState } from "./game/Game";
import { getDeterministicCpuMovePosition } from "./game/cpu";
import {
  createMultiplayerGame,
  listMultiplayerGames,
} from "./multiplayer/api";
import type { MultiplayerGameSummary } from "./shared/multiplayer";

type RoutePath = "/" | "/game";

function resolveRoute(pathname: string): RoutePath {
  return pathname === "/game" ? "/game" : "/";
}

function formatMultiplayerTimestamp(timestamp: string): string {
  const value = new Date(timestamp);

  if (Number.isNaN(value.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(value);
}

function LandingPage({ onStartGame }: { onStartGame: () => void }) {
  const [isJoinPanelVisible, setIsJoinPanelVisible] = useState<boolean>(false);
  const [waitingGames, setWaitingGames] = useState<MultiplayerGameSummary[]>([]);
  const [createdGame, setCreatedGame] = useState<MultiplayerGameSummary | null>(null);
  const [isLoadingWaitingGames, setIsLoadingWaitingGames] = useState<boolean>(false);
  const [isCreatingMultiplayerGame, setIsCreatingMultiplayerGame] =
    useState<boolean>(false);
  const [multiplayerError, setMultiplayerError] = useState<string>("");

  const loadWaitingGames = async () => {
    setIsLoadingWaitingGames(true);
    setMultiplayerError("");

    try {
      const response = await listMultiplayerGames("waiting");
      setWaitingGames(response.games);
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to load waiting games."
      );
    } finally {
      setIsLoadingWaitingGames(false);
    }
  };

  const handleCreateMultiplayerGame = async () => {
    setIsCreatingMultiplayerGame(true);
    setIsJoinPanelVisible(true);
    setMultiplayerError("");

    try {
      const response = await createMultiplayerGame();
      setCreatedGame(response.game);
      await loadWaitingGames();
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to create a multiplayer game."
      );
    } finally {
      setIsCreatingMultiplayerGame(false);
    }
  };

  const handleOpenJoinPanel = async () => {
    setIsJoinPanelVisible(true);
    await loadWaitingGames();
  };

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
        <div className="landing-actions">
          <button type="button" className="landing-cta" onClick={onStartGame}>
            Play vs CPU
          </button>
          <button
            type="button"
            className="landing-cta landing-cta-secondary"
            onClick={() => {
              void handleCreateMultiplayerGame();
            }}
            disabled={isCreatingMultiplayerGame}
          >
            {isCreatingMultiplayerGame ? "Creating..." : "Start Multiplayer Game"}
          </button>
          <button
            type="button"
            className="landing-cta landing-cta-ghost"
            onClick={() => {
              void handleOpenJoinPanel();
            }}
            disabled={isLoadingWaitingGames}
          >
            {isLoadingWaitingGames && isJoinPanelVisible
              ? "Loading..."
              : "Join Multiplayer Game"}
          </button>
        </div>

        {createdGame ? (
          <section className="multiplayer-created-card" aria-live="polite">
            <p className="multiplayer-created-label">Waiting game created</p>
            <p className="multiplayer-created-id">{createdGame.id}</p>
            <p className="multiplayer-created-help">
              Share this game ID so another player can join it in the next story flow.
            </p>
          </section>
        ) : null}

        {isJoinPanelVisible ? (
          <section className="multiplayer-panel" aria-live="polite">
            <div className="multiplayer-panel-header">
              <div>
                <p className="multiplayer-panel-kicker">Multiplayer Lobby</p>
                <h2>Waiting games</h2>
              </div>
              <button
                type="button"
                className="multiplayer-refresh"
                onClick={() => {
                  void loadWaitingGames();
                }}
                disabled={isLoadingWaitingGames}
              >
                Refresh
              </button>
            </div>

            {multiplayerError ? (
              <p className="multiplayer-message multiplayer-message-error">
                {multiplayerError}
              </p>
            ) : null}

            {!multiplayerError && waitingGames.length === 0 && !isLoadingWaitingGames ? (
              <p className="multiplayer-message">
                No waiting games yet. Start one to create a joinable lobby.
              </p>
            ) : null}

            {waitingGames.length > 0 ? (
              <ul className="multiplayer-game-list">
                {waitingGames.map((game) => (
                  <li key={game.id} className="multiplayer-game-card">
                    <div>
                      <p className="multiplayer-game-id">{game.id}</p>
                      <p className="multiplayer-game-meta">
                        Created {formatMultiplayerTimestamp(game.createdAt)}
                      </p>
                    </div>
                    <div className="multiplayer-game-badge">
                      <span>{game.status}</span>
                      <span>{game.openSeatCount} seat open</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

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

const CONFETTI_INDICES = Array.from({ length: 26 }, (_, index) => index);

function GameplayPage({ onExitGame }: { onExitGame: () => void }) {
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

    const cpuMovePosition = getDeterministicCpuMovePosition(gameRef.current);

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
            onClick={onExitGame}
          >
            {isGameOver ? "Home" : "Quit"}
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
    return <GameplayPage onExitGame={() => navigateTo("/")} />;
  }

  return <LandingPage onStartGame={() => navigateTo("/game")} />;
}
