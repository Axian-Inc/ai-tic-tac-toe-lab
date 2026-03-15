import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Game, type BoardCell, type GameState, type Player } from "./game/Game";
import { getDeterministicCpuMovePosition } from "./game/cpu";
import {
  createMultiplayerGame,
  getMultiplayerGame,
  joinMultiplayerGame,
  listMultiplayerGames,
} from "./multiplayer/api";
import type {
  MultiplayerGameSnapshot,
  MultiplayerGameSummary,
  MultiplayerSession,
} from "./shared/multiplayer";

type RoutePath = "/" | "/game";

interface SinglePlayerGameView {
  kind: "singleplayer";
}

interface MultiplayerGameView {
  kind: "multiplayer";
  game: MultiplayerGameSnapshot;
  session: MultiplayerSession;
}

type GameView = SinglePlayerGameView | MultiplayerGameView;

const SINGLE_PLAYER_GAME_VIEW: SinglePlayerGameView = {
  kind: "singleplayer",
};

function resolveRoute(pathname: string): RoutePath {
  return pathname === "/game" ? "/game" : "/";
}

function readHistoryGameView(path: RoutePath, historyState: unknown): GameView {
  if (path !== "/game") {
    return SINGLE_PLAYER_GAME_VIEW;
  }

  const state = historyState as { gameView?: GameView } | null;

  if (state?.gameView?.kind === "multiplayer") {
    return state.gameView;
  }

  return SINGLE_PLAYER_GAME_VIEW;
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

function getCellLabel(cell: BoardCell): string {
  if (cell === "X") {
    return "X";
  }

  if (cell === "O") {
    return "O";
  }

  return "";
}

function getSinglePlayerStatusMessage(gameState: GameState): string {
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

function getMultiplayerStatusMessage(
  game: MultiplayerGameSnapshot,
  session: MultiplayerSession
): string {
  if (game.status === "waiting") {
    return "Waiting for player O to join this match.";
  }

  if (game.state.status.isOver) {
    if (game.state.status.winner === session.player) {
      return "Game over: You win!";
    }

    if (game.state.status.winner === null) {
      return "Game over: It's a draw.";
    }

    return "Game over: Opponent wins.";
  }

  if (game.state.currentPlayer === session.player) {
    return `Your turn (${session.player})`;
  }

  return `Opponent turn (${game.state.currentPlayer})`;
}

function getParticipantLabel(player: Player, sessionPlayer: Player): string {
  return player === sessionPlayer ? "You" : "Opponent";
}

function LandingPage({
  onStartGame,
  onOpenMultiplayerGame,
}: {
  onStartGame: () => void;
  onOpenMultiplayerGame: (gameView: MultiplayerGameView) => void;
}) {
  const [isJoinPanelVisible, setIsJoinPanelVisible] = useState<boolean>(false);
  const [waitingGames, setWaitingGames] = useState<MultiplayerGameSummary[]>([]);
  const [isLoadingWaitingGames, setIsLoadingWaitingGames] = useState<boolean>(false);
  const [isCreatingMultiplayerGame, setIsCreatingMultiplayerGame] =
    useState<boolean>(false);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
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
      onOpenMultiplayerGame({
        kind: "multiplayer",
        game: response.game,
        session: response.session,
      });
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to create a multiplayer game."
      );
      await loadWaitingGames();
    } finally {
      setIsCreatingMultiplayerGame(false);
    }
  };

  const handleJoinMultiplayerGame = async (gameId: string) => {
    setJoiningGameId(gameId);
    setMultiplayerError("");

    try {
      const response = await joinMultiplayerGame(gameId);
      onOpenMultiplayerGame({
        kind: "multiplayer",
        game: response.game,
        session: response.session,
      });
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to join that multiplayer game."
      );
      await loadWaitingGames();
    } finally {
      setJoiningGameId(null);
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
          The classic game of X&apos;s and O&apos;s. Challenge the CPU or start a
          multiplayer match.
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
                {waitingGames.map((game) => {
                  const isJoining = joiningGameId === game.id;

                  return (
                    <li key={game.id} className="multiplayer-game-card">
                      <div>
                        <p className="multiplayer-game-id">{game.id}</p>
                        <p className="multiplayer-game-meta">
                          Created {formatMultiplayerTimestamp(game.createdAt)}
                        </p>
                      </div>
                      <div className="multiplayer-game-actions">
                        <div className="multiplayer-game-badge">
                          <span>{game.status}</span>
                          <span>{game.openSeatCount} seat open</span>
                        </div>
                        <button
                          type="button"
                          className="multiplayer-join-button"
                          onClick={() => {
                            void handleJoinMultiplayerGame(game.id);
                          }}
                          disabled={isJoining || isCreatingMultiplayerGame}
                        >
                          {isJoining ? "Joining..." : "Join"}
                        </button>
                      </div>
                    </li>
                  );
                })}
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

const CONFETTI_INDICES = Array.from({ length: 26 }, (_, index) => index);

function GameplayPage({
  gameView,
  onExitGame,
  onUpdateMultiplayerGame,
}: {
  gameView: GameView;
  onExitGame: () => void;
  onUpdateMultiplayerGame: (gameView: MultiplayerGameView) => void;
}) {
  const isMultiplayer = gameView.kind === "multiplayer";
  const multiplayerGame = isMultiplayer ? gameView.game : null;
  const multiplayerSession = isMultiplayer ? gameView.session : null;
  const gameRef = useRef<Game>(new Game());
  const audioContextRef = useRef<AudioContext | null>(null);
  const confettiTimerRef = useRef<number | null>(null);
  const previousGameOverRef = useRef<boolean>(false);
  const [singlePlayerGameState, setSinglePlayerGameState] = useState<GameState>(() =>
    gameRef.current.getState()
  );
  const [isConfettiVisible, setIsConfettiVisible] = useState<boolean>(false);
  const [confettiBurstId, setConfettiBurstId] = useState<number>(0);
  const [isRefreshingMultiplayerGame, setIsRefreshingMultiplayerGame] =
    useState<boolean>(false);
  const [multiplayerRefreshError, setMultiplayerRefreshError] = useState<string>("");

  const displayedGameState = multiplayerGame?.state ?? singlePlayerGameState;
  const statusMessage =
    multiplayerGame && multiplayerSession
      ? getMultiplayerStatusMessage(multiplayerGame, multiplayerSession)
      : getSinglePlayerStatusMessage(displayedGameState);
  const isGameOver = displayedGameState.status.isOver;
  const isXTurn = !isGameOver && displayedGameState.currentPlayer === "X";
  const isOTurn = !isGameOver && displayedGameState.currentPlayer === "O";
  const isBoardInteractive = !isMultiplayer;

  const boardCells = useMemo(
    () =>
      displayedGameState.board.map((cell, index) => ({
        cell,
        index,
        isInteractive:
          isBoardInteractive &&
          !displayedGameState.status.isOver &&
          displayedGameState.currentPlayer === "X" &&
          gameRef.current.canPlaceMove(index),
      })),
    [
      displayedGameState.board,
      displayedGameState.currentPlayer,
      displayedGameState.status.isOver,
      isBoardInteractive,
    ]
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
    if (isMultiplayer || !gameRef.current.canPlaceMove(position)) {
      return;
    }

    const didPlaceMove = gameRef.current.placeMove(position);

    if (didPlaceMove) {
      playMoveThud();
      setSinglePlayerGameState(gameRef.current.getState());
    }
  };

  const handlePlayAgain = () => {
    clearConfettiTimer();
    setIsConfettiVisible(false);
    gameRef.current = new Game();
    setSinglePlayerGameState(gameRef.current.getState());
  };

  const handleRefreshMultiplayerGame = async () => {
    if (!multiplayerSession) {
      return;
    }

    setIsRefreshingMultiplayerGame(true);
    setMultiplayerRefreshError("");

    try {
      const response = await getMultiplayerGame(multiplayerSession.gameId);
      onUpdateMultiplayerGame({
        kind: "multiplayer",
        game: response.game,
        session: multiplayerSession,
      });
    } catch (error) {
      setMultiplayerRefreshError(
        error instanceof Error ? error.message : "Unable to refresh multiplayer game."
      );
    } finally {
      setIsRefreshingMultiplayerGame(false);
    }
  };

  useEffect(() => {
    if (isMultiplayer || singlePlayerGameState.status.isOver || singlePlayerGameState.currentPlayer !== "O") {
      return;
    }

    const cpuMovePosition = getDeterministicCpuMovePosition(gameRef.current);

    if (cpuMovePosition === null) {
      return;
    }

    const didPlaceCpuMove = gameRef.current.placeMove(cpuMovePosition);

    if (didPlaceCpuMove) {
      playMoveThud();
      setSinglePlayerGameState(gameRef.current.getState());
    }
  }, [isMultiplayer, singlePlayerGameState.currentPlayer, singlePlayerGameState.status.isOver]);

  useEffect(() => {
    if (isMultiplayer) {
      previousGameOverRef.current = displayedGameState.status.isOver;
      return;
    }

    if (!previousGameOverRef.current && displayedGameState.status.isOver) {
      if (displayedGameState.status.winner !== null) {
        triggerConfetti();
      }

      if (displayedGameState.status.winner === "X") {
        playWinningSound();
      } else if (displayedGameState.status.winner === "O") {
        playLosingSound();
      }
    }

    previousGameOverRef.current = displayedGameState.status.isOver;
  }, [displayedGameState.status.isOver, displayedGameState.status.winner, isMultiplayer]);

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
        {!isMultiplayer && isConfettiVisible ? (
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

        {multiplayerGame && multiplayerSession ? (
          <section className="gameplay-session-card" aria-label="Multiplayer session">
            <div className="gameplay-session-header">
              <div>
                <p className="gameplay-session-kicker">Multiplayer Match</p>
                <p className="gameplay-session-id">{multiplayerGame.id}</p>
              </div>
              <button
                type="button"
                className="multiplayer-refresh gameplay-session-refresh"
                onClick={() => {
                  void handleRefreshMultiplayerGame();
                }}
                disabled={isRefreshingMultiplayerGame}
              >
                {isRefreshingMultiplayerGame ? "Refreshing..." : "Refresh Match"}
              </button>
            </div>
            <div className="gameplay-session-meta">
              <span>You are player {multiplayerSession.player}</span>
              <span>Status: {multiplayerGame.status}</span>
              <span>Created {formatMultiplayerTimestamp(multiplayerGame.createdAt)}</span>
            </div>
            <p className="gameplay-session-help">
              {multiplayerGame.status === "waiting"
                ? "Share this match ID with another player. Refresh after they join to see the active session."
                : "Match setup is complete. Multiplayer move submission is added in the next story."}
            </p>
            {multiplayerRefreshError ? (
              <p className="multiplayer-message multiplayer-message-error">
                {multiplayerRefreshError}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="gameplay-players" aria-hidden="true">
          <p
            className={`player-indicator player-indicator-x ${isXTurn ? "player-indicator-active" : ""}`}
          >
            <span className="player-x">X</span>
            <span>
              {multiplayerSession
                ? getParticipantLabel("X", multiplayerSession.player)
                : "You"}
            </span>
          </p>
          <p className="player-indicator player-indicator-vs">VS</p>
          <p
            className={`player-indicator player-indicator-o ${isOTurn ? "player-indicator-active" : ""}`}
          >
            <span className="player-o">O</span>
            <span>
              {multiplayerSession
                ? getParticipantLabel("O", multiplayerSession.player)
                : "CPU"}
            </span>
          </p>
        </div>

        <p
          className={`gameplay-status ${isGameOver ? "gameplay-status-over" : "gameplay-status-active"}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
        {!isMultiplayer && isGameOver && displayedGameState.status.winner === "O" ? (
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
          {!isMultiplayer && isGameOver ? (
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
  const [gameView, setGameView] = useState<GameView>(() =>
    readHistoryGameView(resolveRoute(window.location.pathname), window.history.state)
  );

  useEffect(() => {
    const onPopState = () => {
      const nextRoute = resolveRoute(window.location.pathname);
      setRoute(nextRoute);
      setGameView(readHistoryGameView(nextRoute, window.history.state));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (path: RoutePath, nextGameView?: GameView) => {
    const resolvedGameView = path === "/game" ? nextGameView ?? SINGLE_PLAYER_GAME_VIEW : undefined;
    window.history.pushState({ gameView: resolvedGameView }, "", path);
    setRoute(path);
    setGameView(resolvedGameView ?? SINGLE_PLAYER_GAME_VIEW);
  };

  const updateMultiplayerGame = (nextGameView: MultiplayerGameView) => {
    window.history.replaceState({ gameView: nextGameView }, "", window.location.pathname);
    setGameView(nextGameView);
  };

  if (route === "/game") {
    return (
      <GameplayPage
        gameView={gameView}
        onExitGame={() => navigateTo("/")}
        onUpdateMultiplayerGame={updateMultiplayerGame}
      />
    );
  }

  return (
    <LandingPage
      onStartGame={() => navigateTo("/game", SINGLE_PLAYER_GAME_VIEW)}
      onOpenMultiplayerGame={(nextGameView) => navigateTo("/game", nextGameView)}
    />
  );
}
