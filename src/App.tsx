import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Game, type BoardCell, type GameState, type Player } from "./game/Game";
import { getDeterministicCpuMovePosition } from "./game/cpu";
import {
  checkMultiplayerAbandonment,
  createMultiplayerGame,
  getMultiplayerGame,
  getMultiplayerGameWithOptions,
  getMultiplayerWebSocketUrl,
  joinMultiplayerGame,
  listMultiplayerGames,
  resignMultiplayerGame,
  submitMultiplayerMove,
} from "./multiplayer/api";
import { buildMultiplayerReplayFrames } from "./multiplayer/replay";
import type {
  CreateGameRequest,
  MultiplayerGameEvent,
  MultiplayerGameSnapshot,
  MultiplayerGameSummary,
  MultiplayerServerEvent,
  MultiplayerSpectatorSession,
  MultiplayerSession,
} from "./shared/multiplayer";
import {
  MULTIPLAYER_GAME_NAME_MAX_LENGTH,
  MULTIPLAYER_PLAYER_NAME_MAX_LENGTH,
} from "./shared/multiplayer";

type RoutePath = "/" | "/game";

interface SinglePlayerGameView {
  kind: "singleplayer";
}

interface MultiplayerGameView {
  kind: "multiplayer";
  game: MultiplayerGameSnapshot | null;
  session: MultiplayerSession;
}

type GameView = SinglePlayerGameView | MultiplayerGameView;
type LiveSyncState = "idle" | "connecting" | "connected" | "reconnecting" | "unavailable";
type MultiplayerModalView = "create" | "join";

const SINGLE_PLAYER_GAME_VIEW: SinglePlayerGameView = {
  kind: "singleplayer",
};

function resolveRoute(pathname: string): RoutePath {
  return pathname === "/game" ? "/game" : "/";
}

function createMultiplayerGameView(
  session: MultiplayerSession,
  game: MultiplayerGameSnapshot | null
): MultiplayerGameView {
  return {
    kind: "multiplayer",
    game,
    session,
  };
}

function createSpectatorSession(gameId: string): MultiplayerSpectatorSession {
  return {
    gameId,
    role: "spectator",
    player: null,
    mode: "multiplayer",
  };
}

function readSearchMultiplayerSession(search: string): MultiplayerSession | null {
  const query = new URLSearchParams(search);
  const mode = query.get("mode");
  const gameId = query.get("gameId");
  const role = query.get("role");
  const player = query.get("player");

  if (mode !== "multiplayer" || !gameId) {
    return null;
  }

  if (role === "spectator") {
    return createSpectatorSession(gameId);
  }

  if (player !== "X" && player !== "O") {
    return null;
  }

  return {
    gameId,
    role: "player",
    player,
    mode: "multiplayer",
  };
}

function readHistoryGameView(
  path: RoutePath,
  historyState: unknown,
  search: string
): GameView {
  if (path !== "/game") {
    return SINGLE_PLAYER_GAME_VIEW;
  }

  const state = historyState as { gameView?: GameView } | null;

  if (state?.gameView?.kind === "multiplayer") {
    return state.gameView;
  }

  const multiplayerSession = readSearchMultiplayerSession(search);
  if (multiplayerSession) {
    return createMultiplayerGameView(multiplayerSession, null);
  }

  return SINGLE_PLAYER_GAME_VIEW;
}

function buildGameLocation(path: RoutePath, gameView?: GameView): string {
  if (path !== "/game" || !gameView || gameView.kind !== "multiplayer") {
    return path;
  }

  const query = new URLSearchParams({
    mode: gameView.session.mode,
    gameId: gameView.session.gameId,
  });

  if (gameView.session.role === "spectator") {
    query.set("role", "spectator");
  } else {
    query.set("player", gameView.session.player);
  }

  return `${path}?${query.toString()}`;
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

function normalizeMultiplayerModalInput(value: string): string {
  return value.trim();
}

function validateCreateMultiplayerRequest(
  request: CreateGameRequest
): string | null {
  const playerName = normalizeMultiplayerModalInput(request.playerName);
  const gameName = normalizeMultiplayerModalInput(request.gameName);

  if (playerName.length === 0) {
    return "Enter your player name to host a multiplayer game.";
  }

  if (gameName.length === 0) {
    return "Enter a game name to create a multiplayer game.";
  }

  if (playerName.length > MULTIPLAYER_PLAYER_NAME_MAX_LENGTH) {
    return `Player name must be ${MULTIPLAYER_PLAYER_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (gameName.length > MULTIPLAYER_GAME_NAME_MAX_LENGTH) {
    return `Game name must be ${MULTIPLAYER_GAME_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return null;
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
  game: MultiplayerGameSnapshot | null,
  session: MultiplayerSession
): string {
  if (game === null) {
    return "Loading multiplayer game...";
  }

  if (game.status === "waiting") {
    return session.role === "spectator"
      ? "Waiting for players to start this match."
      : "Waiting for player O to join this match.";
  }

  if (game.state.status.isOver) {
    if (game.completion?.endReason === "resignation") {
      if (session.role === "player" && game.completion.loser === session.player) {
        return "Game over: You resigned.";
      }

      if (session.role === "player") {
        return "Game over: Opponent resigned.";
      }

      return `Game over: Player ${game.completion.loser} resigned.`;
    }

    if (game.completion?.endReason === "abandonment") {
      if (session.role === "player" && game.completion.loser === session.player) {
        return "Game over: You abandoned the match.";
      }

      if (session.role === "player") {
        return "Game over: Opponent abandoned the match.";
      }

      return `Game over: Player ${game.completion.loser} abandoned the match.`;
    }

    if (session.role === "player" && game.state.status.winner === session.player) {
      return "Game over: You win!";
    }

    if (game.state.status.winner === null) {
      return "Game over: It's a draw.";
    }

    return session.role === "player"
      ? "Game over: Opponent wins."
      : `Game over: Player ${game.state.status.winner} wins.`;
  }

  if (session.role === "spectator") {
    return `Live game: Player ${game.state.currentPlayer}'s turn.`;
  }

  if (game.state.currentPlayer === session.player) {
    return `Your turn (${session.player})`;
  }

  return `Opponent turn (${game.state.currentPlayer})`;
}

function getParticipantLabel(player: Player, session: MultiplayerSession): string {
  if (session.role === "spectator") {
    return `Player ${player}`;
  }

  return player === session.player ? "You" : "Opponent";
}

function getMultiplayerMatchTitle(game: MultiplayerGameSnapshot): string {
  return game.name;
}

function getMultiplayerHostLabel(game: MultiplayerGameSnapshot): string {
  return game.hostName;
}

function getDiscoveryGameTimestampLabel(game: MultiplayerGameSummary): string {
  return game.status === "waiting"
    ? `Created ${formatMultiplayerTimestamp(game.createdAt)}`
    : `Updated ${formatMultiplayerTimestamp(game.updatedAt)}`;
}

function getLiveSyncLabel(liveSyncState: LiveSyncState): string {
  if (liveSyncState === "connected") {
    return "Live sync connected";
  }

  if (liveSyncState === "connecting") {
    return "Live sync connecting";
  }

  if (liveSyncState === "reconnecting") {
    return "Live sync reconnecting";
  }

  if (liveSyncState === "unavailable") {
    return "Live sync unavailable";
  }

  return "Live sync idle";
}

function formatDurationParts(totalMilliseconds: number): string {
  const totalSeconds = Math.max(Math.ceil(totalMilliseconds / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getReplayEventSummary(event: MultiplayerGameEvent): string {
  if (event.type === "game-created") {
    return `Player ${event.player} created the match.`;
  }

  if (event.type === "player-joined") {
    return `Player ${event.player} joined the match.`;
  }

  if (event.completion.endReason === "resignation") {
    return `Completed by resignation. Player ${event.completion.loser} resigned.`;
  }

  if (event.completion.endReason === "abandonment") {
    return `Completed by abandonment. Player ${event.completion.loser} timed out.`;
  }

  if (event.completion.endReason === "draw") {
    return "Completed as a draw.";
  }

  return `Completed with player ${event.completion.winner} winning.`;
}

function LandingPage({
  onStartGame,
  onOpenMultiplayerGame,
}: {
  onStartGame: () => void;
  onOpenMultiplayerGame: (gameView: MultiplayerGameView) => void;
}) {
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);
  const [multiplayerModalView, setMultiplayerModalView] =
    useState<MultiplayerModalView>("create");
  const [playerName, setPlayerName] = useState<string>("");
  const [gameName, setGameName] = useState<string>("");
  const [waitingGames, setWaitingGames] = useState<MultiplayerGameSummary[]>([]);
  const [activeGames, setActiveGames] = useState<MultiplayerGameSummary[]>([]);
  const [isLoadingWaitingGames, setIsLoadingWaitingGames] = useState<boolean>(false);
  const [isLoadingActiveGames, setIsLoadingActiveGames] = useState<boolean>(false);
  const [isCreatingMultiplayerGame, setIsCreatingMultiplayerGame] =
    useState<boolean>(false);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const [spectatingGameId, setSpectatingGameId] = useState<string | null>(null);
  const [multiplayerError, setMultiplayerError] = useState<string>("");
  const createPlayerNameInputRef = useRef<HTMLInputElement | null>(null);

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

  const loadDiscoveryGames = async () => {
    setIsLoadingWaitingGames(true);
    setIsLoadingActiveGames(true);
    setMultiplayerError("");

    try {
      const [waitingResponse, activeResponse] = await Promise.all([
        listMultiplayerGames("waiting"),
        listMultiplayerGames("active"),
      ]);
      setWaitingGames(waitingResponse.games);
      setActiveGames(activeResponse.games);
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to load available games."
      );
    } finally {
      setIsLoadingWaitingGames(false);
      setIsLoadingActiveGames(false);
    }
  };

  const handleCreateMultiplayerGame = async () => {
    const request = {
      playerName: normalizeMultiplayerModalInput(playerName),
      gameName: normalizeMultiplayerModalInput(gameName),
    };
    const validationError = validateCreateMultiplayerRequest(request);

    if (validationError) {
      setMultiplayerError(validationError);
      return;
    }

    setIsCreatingMultiplayerGame(true);
    setMultiplayerError("");

    try {
      const response = await createMultiplayerGame(request);
      onOpenMultiplayerGame(
        createMultiplayerGameView(response.session, response.game)
      );
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
      onOpenMultiplayerGame(
        createMultiplayerGameView(response.session, response.game)
      );
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
    setMultiplayerModalView("join");
    await loadDiscoveryGames();
  };

  const handleSpectateMultiplayerGame = async (gameId: string) => {
    setSpectatingGameId(gameId);
    setMultiplayerError("");

    try {
      const response = await getMultiplayerGame(gameId);
      onOpenMultiplayerGame(
        createMultiplayerGameView(createSpectatorSession(gameId), response.game)
      );
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to spectate that game."
      );
      await loadDiscoveryGames();
    } finally {
      setSpectatingGameId(null);
    }
  };

  const closeMultiplayerModal = () => {
    setIsMultiplayerModalOpen(false);
    setMultiplayerError("");
  };

  const handleOpenMultiplayerModal = () => {
    setIsMultiplayerModalOpen(true);
    setMultiplayerModalView("create");
    setMultiplayerError("");
  };

  useEffect(() => {
    if (!isMultiplayerModalOpen) {
      return;
    }

    if (multiplayerModalView === "create") {
      createPlayerNameInputRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMultiplayerModalOpen(false);
        setMultiplayerError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMultiplayerModalOpen, multiplayerModalView]);

  return (
    <main className="page page-landing" data-testid="landing-page">
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
            onClick={handleOpenMultiplayerModal}
          >
            Multiplayer
          </button>
        </div>

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

      {isMultiplayerModalOpen ? (
        <div
          className="multiplayer-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeMultiplayerModal();
            }
          }}
        >
          <section
            className="multiplayer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="multiplayer-modal-title"
          >
            <div className="multiplayer-modal-header">
              <h2 id="multiplayer-modal-title">Multiplayer</h2>
              <button
                type="button"
                className="multiplayer-modal-close"
                onClick={closeMultiplayerModal}
                aria-label="Close multiplayer setup"
              >
                X
              </button>
            </div>

            <label className="multiplayer-field">
              <span className="multiplayer-field-label">Your Name</span>
              <input
                ref={createPlayerNameInputRef}
                type="text"
                className="multiplayer-text-input"
                value={playerName}
                onChange={(event) => {
                  setPlayerName(event.target.value);
                }}
                placeholder="Enter your name here"
                autoComplete="nickname"
                maxLength={MULTIPLAYER_PLAYER_NAME_MAX_LENGTH}
              />
            </label>

            <div className="multiplayer-mode-switch" aria-label="Multiplayer actions">
              <button
                type="button"
                className={`multiplayer-mode-button ${multiplayerModalView === "create" ? "multiplayer-mode-button-active" : ""}`}
                onClick={() => {
                  setMultiplayerModalView("create");
                  setMultiplayerError("");
                }}
              >
                Create
              </button>
              <button
                type="button"
                className={`multiplayer-mode-button ${multiplayerModalView === "join" ? "multiplayer-mode-button-active" : ""}`}
                onClick={() => {
                  void handleOpenJoinPanel();
                }}
              >
                Join
              </button>
            </div>

            {multiplayerError ? (
              <p className="multiplayer-message multiplayer-message-error">
                {multiplayerError}
              </p>
            ) : null}

            {multiplayerModalView === "create" ? (
              <section className="multiplayer-panel multiplayer-modal-panel" aria-live="polite">
                <div className="multiplayer-panel-header">
                  <div>
                    <p className="multiplayer-panel-kicker">Host a Match</p>
                    <h2>Create a new multiplayer game</h2>
                  </div>
                </div>
                <label className="multiplayer-field multiplayer-field-compact">
                  <span className="multiplayer-field-label">Game Name</span>
                  <input
                    type="text"
                    className="multiplayer-text-input"
                    value={gameName}
                    onChange={(event) => {
                      setGameName(event.target.value);
                    }}
                    placeholder="Friday Lunch Match"
                    autoComplete="off"
                    maxLength={MULTIPLAYER_GAME_NAME_MAX_LENGTH}
                  />
                </label>
                <p className="multiplayer-message">
                  Start a waiting match, then share the match ID with another player.
                </p>
                <div className="multiplayer-modal-actions">
                  <button
                    type="button"
                    className="landing-cta multiplayer-modal-submit"
                    onClick={() => {
                      void handleCreateMultiplayerGame();
                    }}
                    disabled={isCreatingMultiplayerGame}
                  >
                    {isCreatingMultiplayerGame ? "Creating..." : "Create Game"}
                  </button>
                  <button
                    type="button"
                    className="multiplayer-refresh multiplayer-modal-cancel"
                    onClick={closeMultiplayerModal}
                    disabled={isCreatingMultiplayerGame}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            ) : null}

            {multiplayerModalView === "join" ? (
              <section className="multiplayer-panel multiplayer-modal-panel" aria-live="polite">
                <div className="multiplayer-panel-header">
                  <div>
                    <p className="multiplayer-panel-kicker">Discover Matches</p>
                    <h2>Join or spectate a multiplayer game</h2>
                  </div>
                  <button
                    type="button"
                    className="multiplayer-refresh"
                    onClick={() => {
                      void loadDiscoveryGames();
                    }}
                    disabled={isLoadingWaitingGames || isLoadingActiveGames}
                  >
                    Refresh
                  </button>
                </div>

                {!multiplayerError &&
                waitingGames.length === 0 &&
                activeGames.length === 0 &&
                !isLoadingWaitingGames &&
                !isLoadingActiveGames ? (
                  <p className="multiplayer-message">
                    No multiplayer games are available right now. Refresh to check
                    again or create a new match.
                  </p>
                ) : null}

                {waitingGames.length > 0 ? (
                  <section className="multiplayer-discovery-group">
                    <div className="multiplayer-discovery-header">
                      <p className="multiplayer-panel-kicker">Joinable Games</p>
                      <span className="multiplayer-discovery-count">
                        {waitingGames.length} waiting
                      </span>
                    </div>
                    <ul className="multiplayer-game-list">
                      {waitingGames.map((game) => {
                        const isJoining = joiningGameId === game.id;
                        const isSpectating = spectatingGameId === game.id;

                        return (
                          <li key={game.id} className="multiplayer-game-card">
                            <div className="multiplayer-game-card-heading">
                              <span className="multiplayer-game-name">{game.name}</span>
                              <span className="multiplayer-game-id">{game.id}</span>
                            </div>
                            <div className="multiplayer-game-card-details">
                              <span className="multiplayer-game-meta-item">
                                Host: {game.hostName}
                              </span>
                              <span className="multiplayer-game-meta-item">
                                {getDiscoveryGameTimestampLabel(game)}
                              </span>
                              <span className="multiplayer-game-meta-item multiplayer-game-status">
                                {game.status}
                              </span>
                              <span className="multiplayer-game-meta-item">
                                {game.openSeatCount} open seat
                                {game.openSeatCount === 1 ? "" : "s"}
                              </span>
                            </div>
                            <div className="multiplayer-game-actions">
                              <button
                                type="button"
                                className="multiplayer-join-button"
                                onClick={() => {
                                  void handleJoinMultiplayerGame(game.id);
                                }}
                                disabled={
                                  isJoining || isSpectating || isCreatingMultiplayerGame
                                }
                              >
                                {isJoining ? "Joining..." : "Join"}
                              </button>
                              <button
                                type="button"
                                className="multiplayer-join-button"
                                onClick={() => {
                                  void handleSpectateMultiplayerGame(game.id);
                                }}
                                disabled={
                                  isJoining || isSpectating || isCreatingMultiplayerGame
                                }
                              >
                                {isSpectating ? "Opening..." : "Spectate"}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : null}

                {activeGames.length > 0 ? (
                  <section className="multiplayer-discovery-group">
                    <div className="multiplayer-discovery-header">
                      <p className="multiplayer-panel-kicker">Live Games</p>
                      <span className="multiplayer-discovery-count">
                        {activeGames.length} active
                      </span>
                    </div>
                    <ul className="multiplayer-game-list">
                      {activeGames.map((game) => {
                        const isSpectating = spectatingGameId === game.id;

                        return (
                          <li
                            key={game.id}
                            className="multiplayer-game-card multiplayer-game-card-active"
                          >
                            <p className="multiplayer-game-id">{game.id}</p>
                            <div className="multiplayer-game-card-content">
                              <div className="multiplayer-game-card-details">
                                <p className="multiplayer-game-name">{game.name}</p>
                                <p className="multiplayer-game-meta">
                                  Hosted by {game.hostName} ·{" "}
                                  {getDiscoveryGameTimestampLabel(game)}
                                </p>
                              </div>
                              <div className="multiplayer-game-actions">
                                <div className="multiplayer-game-badge">
                                  <span>{game.status}</span>
                                  <span>Live</span>
                                </div>
                                <button
                                  type="button"
                                  className="multiplayer-join-button"
                                  onClick={() => {
                                    void handleSpectateMultiplayerGame(game.id);
                                  }}
                                  disabled={isSpectating || isCreatingMultiplayerGame}
                                >
                                  {isSpectating ? "Opening..." : "Spectate"}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : null}
              </section>
            ) : null}
          </section>
        </div>
      ) : null}
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
  const reconnectTimerRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef<boolean>(true);
  const previousGameOverRef = useRef<boolean>(false);
  const [singlePlayerGameState, setSinglePlayerGameState] = useState<GameState>(() =>
    gameRef.current.getState()
  );
  const [isConfettiVisible, setIsConfettiVisible] = useState<boolean>(false);
  const [confettiBurstId, setConfettiBurstId] = useState<number>(0);
  const [isRefreshingMultiplayerGame, setIsRefreshingMultiplayerGame] =
    useState<boolean>(false);
  const [isSubmittingMultiplayerMove, setIsSubmittingMultiplayerMove] =
    useState<boolean>(false);
  const [isResigningMultiplayerGame, setIsResigningMultiplayerGame] =
    useState<boolean>(false);
  const [isCheckingAbandonment, setIsCheckingAbandonment] =
    useState<boolean>(false);
  const [multiplayerError, setMultiplayerError] = useState<string>("");
  const [liveSyncState, setLiveSyncState] = useState<LiveSyncState>("idle");
  const [replayFrameIndex, setReplayFrameIndex] = useState<number | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  const replayFrames = useMemo(
    () => (multiplayerGame ? buildMultiplayerReplayFrames(multiplayerGame) : []),
    [multiplayerGame]
  );
  const replayFrame =
    replayFrameIndex !== null ? replayFrames[replayFrameIndex] ?? null : null;
  const isReplayActive = replayFrame !== null;
  const displayedGameState = replayFrame?.state ?? multiplayerGame?.state ?? singlePlayerGameState;
  const statusMessage =
    isReplayActive && replayFrame
      ? `Replay: ${replayFrame.description}`
      : multiplayerSession && isMultiplayer
      ? getMultiplayerStatusMessage(multiplayerGame, multiplayerSession)
      : getSinglePlayerStatusMessage(displayedGameState);
  const isGameOver = displayedGameState.status.isOver;
  const isXTurn = !isGameOver && displayedGameState.currentPlayer === "X";
  const isOTurn = !isGameOver && displayedGameState.currentPlayer === "O";
  const isLoadingMultiplayerGame = isMultiplayer && multiplayerGame === null;
  const isSpectatorSession = multiplayerSession?.role === "spectator";
  const isActiveMultiplayerPlayerGame =
    isMultiplayer &&
    multiplayerGame !== null &&
    multiplayerSession?.role === "player" &&
    multiplayerGame.status === "active" &&
    !multiplayerGame.state.status.isOver;
  const abandonmentDeadlineTimestamp = multiplayerGame?.activity.abandonmentDeadlineAt
    ? Date.parse(multiplayerGame.activity.abandonmentDeadlineAt)
    : null;
  const abandonmentRemainingMs =
    abandonmentDeadlineTimestamp === null
      ? null
      : Math.max(abandonmentDeadlineTimestamp - nowTimestamp, 0);
  const abandonmentCountdownLabel =
    abandonmentRemainingMs === null
      ? null
      : formatDurationParts(abandonmentRemainingMs);
  const abandonmentAwaitingPlayer = multiplayerGame?.activity.awaitingPlayer ?? null;
  const isAwaitingLocalPlayerTurn =
    multiplayerSession?.role === "player" &&
    abandonmentAwaitingPlayer === multiplayerSession.player;

  const boardCells = useMemo(
    () =>
      displayedGameState.board.map((cell, index) => {
        const isInteractive =
          !isMultiplayer &&
          !displayedGameState.status.isOver &&
          displayedGameState.currentPlayer === "X" &&
          gameRef.current.canPlaceMove(index);

        const isMultiplayerInteractive =
          isMultiplayer &&
          multiplayerGame !== null &&
          !isReplayActive &&
          multiplayerSession?.role === "player" &&
          multiplayerGame.status === "active" &&
          !multiplayerGame.state.status.isOver &&
          !isSubmittingMultiplayerMove &&
          !isResigningMultiplayerGame &&
          multiplayerGame.state.currentPlayer === multiplayerSession?.player &&
          cell === null;

        return {
          cell,
          index,
          isInteractive: isInteractive || isMultiplayerInteractive,
        };
      }),
    [
      displayedGameState.board,
      displayedGameState.currentPlayer,
      displayedGameState.status.isOver,
      isMultiplayer,
      isReplayActive,
      multiplayerSession,
      isResigningMultiplayerGame,
      isSubmittingMultiplayerMove,
      multiplayerGame,
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

  const handlePlayAgain = () => {
    clearConfettiTimer();
    setIsConfettiVisible(false);
    gameRef.current = new Game();
    setSinglePlayerGameState(gameRef.current.getState());
  };

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const syncMultiplayerGame = async (intent: "sync" | "reconnect" = "sync") => {
    if (!multiplayerSession) {
      return;
    }

    const response =
      multiplayerSession.role === "player"
        ? await getMultiplayerGameWithOptions(multiplayerSession.gameId, {
            player: multiplayerSession.player,
            intent,
          })
        : await getMultiplayerGame(multiplayerSession.gameId);
    onUpdateMultiplayerGame(
      createMultiplayerGameView(multiplayerSession, response.game)
    );
  };

  useEffect(() => {
    if (!isMultiplayer) {
      setReplayFrameIndex(null);
      return;
    }

    if (replayFrameIndex === null) {
      return;
    }

    if (replayFrames.length === 0) {
      setReplayFrameIndex(null);
      return;
    }

    if (replayFrameIndex >= replayFrames.length) {
      setReplayFrameIndex(replayFrames.length - 1);
    }
  }, [isMultiplayer, replayFrameIndex, replayFrames]);

  const handleRefreshMultiplayerGame = async () => {
    setIsRefreshingMultiplayerGame(true);
    setMultiplayerError("");

    try {
      await syncMultiplayerGame("sync");
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to refresh multiplayer game."
      );
    } finally {
      setIsRefreshingMultiplayerGame(false);
    }
  };

  const handleResignMultiplayerGame = async () => {
    if (
      !multiplayerSession ||
      multiplayerSession.role !== "player" ||
      !multiplayerGame ||
      multiplayerGame.status !== "active" ||
      multiplayerGame.state.status.isOver ||
      isReplayActive ||
      isResigningMultiplayerGame
    ) {
      return;
    }

    const didConfirm = window.confirm("Resign this multiplayer game?");
    if (!didConfirm) {
      return;
    }

    setIsResigningMultiplayerGame(true);
    setMultiplayerError("");

    try {
      const response = await resignMultiplayerGame(multiplayerSession.gameId, {
        player: multiplayerSession.player,
      });
      onUpdateMultiplayerGame(
        createMultiplayerGameView(multiplayerSession, response.game)
      );
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to resign multiplayer game."
      );
    } finally {
      setIsResigningMultiplayerGame(false);
    }
  };

  const handleCellClick = (position: number) => {
    if (
      isMultiplayer &&
      multiplayerGame !== null &&
      multiplayerSession !== null &&
      multiplayerSession.role === "player" &&
      !isReplayActive &&
      multiplayerGame.status === "active" &&
      multiplayerGame.state.currentPlayer === multiplayerSession.player &&
      multiplayerGame.state.board[position] === null &&
      !multiplayerGame.state.status.isOver &&
      !isSubmittingMultiplayerMove
    ) {
      setIsSubmittingMultiplayerMove(true);
      setMultiplayerError("");

      void submitMultiplayerMove(multiplayerSession.gameId, {
        player: multiplayerSession.player,
        position,
      })
        .then((response) => {
          playMoveThud();
          onUpdateMultiplayerGame(
            createMultiplayerGameView(multiplayerSession, response.game)
          );
        })
        .catch((error: unknown) => {
          setMultiplayerError(
            error instanceof Error
              ? error.message
              : "Unable to submit multiplayer move."
          );
        })
        .finally(() => {
          setIsSubmittingMultiplayerMove(false);
        });

      return;
    }

    if (!isMultiplayer && gameRef.current.canPlaceMove(position)) {
      const didPlaceMove = gameRef.current.placeMove(position);

      if (didPlaceMove) {
        playMoveThud();
        setSinglePlayerGameState(gameRef.current.getState());
      }
    }
  };

  useEffect(() => {
    if (
      !isMultiplayer ||
      multiplayerSession === null ||
      multiplayerGame !== null
    ) {
      return;
    }

    setMultiplayerError("");
    void syncMultiplayerGame("reconnect").catch((error: unknown) => {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to load multiplayer game."
      );
    });
  }, [isMultiplayer, multiplayerGame, multiplayerSession]);

  useEffect(() => {
    if (!isMultiplayer || multiplayerSession === null) {
      setLiveSyncState("idle");
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      if (websocketRef.current !== null) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      return;
    }

    let isDisposed = false;
    shouldReconnectRef.current = true;
    clearReconnectTimer();
    const connectWebSocket = (isReconnectAttempt: boolean) => {
      if (isDisposed || !shouldReconnectRef.current) {
        return;
      }

      setLiveSyncState(isReconnectAttempt ? "reconnecting" : "connecting");

      const websocket = new WebSocket(
        getMultiplayerWebSocketUrl(multiplayerSession.gameId)
      );
      websocketRef.current = websocket;

      websocket.addEventListener("open", () => {
        if (!isDisposed) {
          setLiveSyncState("connected");
        }
      });

      websocket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as MultiplayerServerEvent;

          if (
            message.type === "connection-ready" ||
            message.type === "resync-needed" ||
            message.type === "move-applied" ||
            message.type === "resigned" ||
            message.type === "abandoned" ||
            message.type === "game-over"
          ) {
            onUpdateMultiplayerGame(
              createMultiplayerGameView(multiplayerSession, message.game)
            );
          }
        } catch {
          if (!isDisposed) {
            setLiveSyncState("unavailable");
          }
        }
      });

      websocket.addEventListener("error", () => {
        if (!isDisposed) {
          setLiveSyncState("unavailable");
        }
      });

      websocket.addEventListener("close", () => {
        if (isDisposed || !shouldReconnectRef.current) {
          if (!isDisposed) {
            setLiveSyncState("idle");
          }
          return;
        }

        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(() => {
          void syncMultiplayerGame("reconnect")
            .catch(() => {
              if (!isDisposed) {
                setLiveSyncState("unavailable");
              }
            })
            .finally(() => {
              connectWebSocket(true);
            });
        }, 1200);
      });
    };

    connectWebSocket(false);

    return () => {
      isDisposed = true;
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      if (websocketRef.current !== null) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [isMultiplayer, multiplayerSession]);

  useEffect(() => {
    if (
      isMultiplayer ||
      singlePlayerGameState.status.isOver ||
      singlePlayerGameState.currentPlayer !== "O"
    ) {
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
  }, [
    isMultiplayer,
    singlePlayerGameState.currentPlayer,
    singlePlayerGameState.status.isOver,
  ]);

  useEffect(() => {
    if (
      !isMultiplayer ||
      multiplayerGame === null ||
      multiplayerGame.status !== "active" ||
      multiplayerGame.state.status.isOver
    ) {
      return;
    }

    setNowTimestamp(Date.now());
    const timerId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isMultiplayer, multiplayerGame]);

  const handleCheckAbandonment = async () => {
    if (
      !multiplayerSession ||
      multiplayerSession.role !== "player" ||
      !multiplayerGame ||
      multiplayerGame.status !== "active" ||
      multiplayerGame.state.status.isOver ||
      isReplayActive ||
      isCheckingAbandonment
    ) {
      return;
    }

    setIsCheckingAbandonment(true);
    setMultiplayerError("");

    try {
      const response = await checkMultiplayerAbandonment(multiplayerSession.gameId);
      onUpdateMultiplayerGame(
        createMultiplayerGameView(multiplayerSession, response.game)
      );
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Unable to check for abandonment."
      );
    } finally {
      setIsCheckingAbandonment(false);
    }
  };

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

  const multiplayerHelpMessage =
    multiplayerGame === null
      ? "Loading the authoritative multiplayer state from the server."
      : isReplayActive
        ? multiplayerSession?.role === "player"
          ? "You are viewing retained history. Return to live before making moves or resigning."
          : "You are viewing retained history. Return to live to resume following the match in real time."
      : multiplayerSession?.role === "spectator"
        ? liveSyncState === "connected"
          ? "You are spectating this match. The board is read-only and live updates are arriving automatically."
          : "You are spectating this match. The board is read-only; use Refresh Match if live sync is unavailable."
      : multiplayerGame.status === "waiting"
        ? "Share this match ID with another player. Refresh after they join to see the active session."
        : multiplayerGame.completion?.endReason === "abandonment"
          ? `This match ended by abandonment. Player ${multiplayerGame.completion.loser} failed to make the required move in time.`
        : multiplayerGame.completion?.endReason === "resignation"
          ? "This match ended by resignation. No additional moves are accepted."
        : liveSyncState === "connected"
          ? "Moves are validated by the server and live updates are arriving automatically."
          : "Moves are validated by the server. If live sync is unavailable, use Refresh Match to pull the latest state.";
  const abandonmentMessage =
    multiplayerGame === null ||
    multiplayerGame.status !== "active" ||
    multiplayerGame.state.status.isOver ||
    abandonmentCountdownLabel === null
      ? null
      : multiplayerSession?.role === "spectator"
        ? `Waiting on player ${abandonmentAwaitingPlayer}. Timeout window ends in ${abandonmentCountdownLabel}.`
        : isAwaitingLocalPlayerTurn
          ? `Your required move timeout window ends in ${abandonmentCountdownLabel}.`
          : `Opponent timeout window ends in ${abandonmentCountdownLabel}. You can ask the server to resolve abandonment when it expires.`;
  const isReplayAvailable = replayFrames.length > 1;
  const lastReplayFrameIndex = replayFrames.length - 1;
  const latestHistoryEvent =
    multiplayerGame && multiplayerGame.history.events.length > 0
      ? multiplayerGame.history.events[multiplayerGame.history.events.length - 1]
      : null;

  return (
    <main
      className="page page-gameplay"
      aria-label="Gameplay board"
      data-testid="gameplay-page"
    >
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

        {multiplayerSession ? (
          <section className="gameplay-session-card" aria-label="Multiplayer session">
            <div className="gameplay-session-header">
              <div>
                <p className="gameplay-session-kicker">Multiplayer Match</p>
                {multiplayerGame ? (
                  <p className="gameplay-session-title">
                    {getMultiplayerMatchTitle(multiplayerGame)}
                  </p>
                ) : null}
                <p className="gameplay-session-id">{multiplayerSession.gameId}</p>
              </div>
              <button
                type="button"
                className="multiplayer-refresh gameplay-session-refresh"
                onClick={() => {
                  void handleRefreshMultiplayerGame();
                }}
                disabled={isRefreshingMultiplayerGame || isLoadingMultiplayerGame}
              >
                {isRefreshingMultiplayerGame ? "Refreshing..." : "Refresh Match"}
              </button>
            </div>
            <div className="gameplay-session-meta">
              <span>
                {multiplayerSession.role === "spectator"
                  ? "You are spectating"
                  : `You are player ${multiplayerSession.player}`}
              </span>
              {multiplayerGame ? (
                <span>Hosted by {getMultiplayerHostLabel(multiplayerGame)}</span>
              ) : null}
              {multiplayerGame ? <span>Status: {multiplayerGame.status}</span> : null}
              {multiplayerGame ? (
                <span>Created {formatMultiplayerTimestamp(multiplayerGame.createdAt)}</span>
              ) : null}
            </div>
            <p
              className={`gameplay-live-sync gameplay-live-sync-${liveSyncState}`}
              role="status"
              aria-live="polite"
            >
              {getLiveSyncLabel(liveSyncState)}
            </p>
            <p className="gameplay-session-help">{multiplayerHelpMessage}</p>
            {abandonmentMessage ? (
              <p className="gameplay-session-help">{abandonmentMessage}</p>
            ) : null}
            {multiplayerError ? (
              <p className="multiplayer-message multiplayer-message-error">
                {multiplayerError}
              </p>
            ) : null}
            {multiplayerGame && isReplayAvailable ? (
              <section className="gameplay-history-card" aria-label="Replay and catch-up">
                <div className="gameplay-history-header">
                  <div>
                    <p className="gameplay-session-kicker">Replay and Catch-Up</p>
                    <p className="gameplay-history-title">
                      {isReplayActive
                        ? `${replayFrame.label} of ${replayFrames[lastReplayFrameIndex].label}`
                        : "Viewing live state"}
                    </p>
                  </div>
                  <p className="gameplay-history-retention">
                    Retention: {multiplayerGame.history.retention.mode} only
                  </p>
                </div>
                <p className="gameplay-history-summary">
                  {isReplayActive
                    ? replayFrame.description
                    : `${multiplayerGame.state.moves.length} recorded moves available for catch-up and replay.`}
                </p>
                <p className="gameplay-history-meta">
                  <span>{multiplayerGame.history.events.length} lifecycle events retained</span>
                  {latestHistoryEvent ? (
                    <span>{getReplayEventSummary(latestHistoryEvent)}</span>
                  ) : null}
                </p>
                <div className="gameplay-history-controls">
                  <button
                    type="button"
                    className="multiplayer-refresh gameplay-history-button"
                    onClick={() => {
                      setReplayFrameIndex(0);
                    }}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    className="multiplayer-refresh gameplay-history-button"
                    onClick={() => {
                      setReplayFrameIndex((current) => {
                        if (current === null) {
                          return Math.max(lastReplayFrameIndex - 1, 0);
                        }

                        return Math.max(current - 1, 0);
                      });
                    }}
                    disabled={replayFrameIndex === 0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="multiplayer-refresh gameplay-history-button"
                    onClick={() => {
                      setReplayFrameIndex((current) => {
                        if (current === null) {
                          return lastReplayFrameIndex;
                        }

                        return Math.min(current + 1, lastReplayFrameIndex);
                      });
                    }}
                    disabled={replayFrameIndex === lastReplayFrameIndex}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="multiplayer-refresh gameplay-history-button"
                    onClick={() => {
                      setReplayFrameIndex(null);
                    }}
                    disabled={!isReplayActive}
                  >
                    Return to Live
                  </button>
                </div>
              </section>
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
                ? getParticipantLabel("X", multiplayerSession)
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
                ? getParticipantLabel("O", multiplayerSession)
                : "CPU"}
            </span>
          </p>
        </div>

        <p
          className={`gameplay-status ${isGameOver ? "gameplay-status-over" : "gameplay-status-active"}`}
          role="status"
          aria-live="polite"
          data-testid="game-status"
        >
          {statusMessage}
        </p>
        {!isMultiplayer && isGameOver && displayedGameState.status.winner === "O" ? (
          <p className="gameplay-loss-feedback">Try again.</p>
        ) : null}

        <section
          className={`game-board ${isGameOver ? "game-board-over" : ""}`}
          aria-label="Tic Tac Toe board"
          data-testid="game-board"
        >
          {boardCells.map(({ cell, index, isInteractive }) => (
            <button
              type="button"
              key={index}
              className={`board-cell ${isInteractive ? "board-cell-available" : "board-cell-blocked"} ${cell ? `board-cell-${cell.toLowerCase()}` : ""}`}
              onClick={() => handleCellClick(index)}
              disabled={!isInteractive}
              aria-label={`Cell ${index + 1}${cell ? `, marked ${cell}` : ""}${!isInteractive ? ", unavailable" : ", available"}`}
              data-testid={`board-cell-${index}`}
            >
              {getCellLabel(cell)}
            </button>
          ))}
        </section>

        <div className="gameplay-controls">
          {isActiveMultiplayerPlayerGame ? (
            <>
              <button
                type="button"
                className="gameplay-control gameplay-control-primary"
                onClick={() => {
                  void handleResignMultiplayerGame();
                }}
                disabled={isResigningMultiplayerGame || isReplayActive}
              >
                {isResigningMultiplayerGame ? "Resigning..." : "Resign"}
              </button>
              <button
                type="button"
                className="gameplay-control gameplay-control-secondary"
                onClick={() => {
                  void handleCheckAbandonment();
                }}
                disabled={isCheckingAbandonment || isReplayActive}
              >
                {isCheckingAbandonment ? "Checking..." : "Check Timeout"}
              </button>
            </>
          ) : null}
          {!isMultiplayer && isGameOver ? (
            <button
              type="button"
              className="gameplay-control gameplay-control-primary"
              onClick={handlePlayAgain}
              data-testid="play-again-button"
            >
              Play Again
            </button>
          ) : null}
          {!isActiveMultiplayerPlayerGame ? (
            <button
              type="button"
              className="gameplay-control gameplay-control-secondary"
              onClick={onExitGame}
            >
              {isGameOver || isSpectatorSession ? "Home" : "Quit"}
            </button>
          ) : null}
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
    readHistoryGameView(
      resolveRoute(window.location.pathname),
      window.history.state,
      window.location.search
    )
  );

  useEffect(() => {
    const onPopState = () => {
      const nextRoute = resolveRoute(window.location.pathname);
      setRoute(nextRoute);
      setGameView(
        readHistoryGameView(nextRoute, window.history.state, window.location.search)
      );
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (path: RoutePath, nextGameView?: GameView) => {
    const resolvedGameView =
      path === "/game" ? nextGameView ?? SINGLE_PLAYER_GAME_VIEW : undefined;
    window.history.pushState(
      { gameView: resolvedGameView },
      "",
      buildGameLocation(path, resolvedGameView)
    );
    setRoute(path);
    setGameView(resolvedGameView ?? SINGLE_PLAYER_GAME_VIEW);
  };

  const updateMultiplayerGame = (nextGameView: MultiplayerGameView) => {
    window.history.replaceState(
      { gameView: nextGameView },
      "",
      buildGameLocation("/game", nextGameView)
    );
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
