import { create } from "zustand";
import {
  checkAbandonment as checkOnlineAbandonment,
  createGame as createOnlineGameRequest,
  getEvents as getOnlineEvents,
  getGame as getOnlineGame,
  joinGame as joinOnlineGameRequest,
  makeMove as makeOnlineMove,
  OnlineApiError,
  resign as resignOnlineGameRequest,
} from "../api/client";
import { ApiConfigurationError } from "../api/config";
import { normalizePublicGame, type OnlineRole } from "../api/types";
import {
  openOnlineGameSocket,
  type OnlineConnectionStatus,
  type OnlineSocket,
} from "../api/websocket";
import type { Game, GameMode, PlayerMark } from "../game";
import {
  abandonGame,
  createGame as createLocalGame,
  playTurn,
} from "../game";

export type OnlineSessionState = {
  gameId: string | null;
  role: OnlineRole | null;
  playerMark: PlayerMark | null;
  playerToken: string | null;
  displayName: string;
  connectionStatus: OnlineConnectionStatus;
  latestSequence: number;
  error: string | null;
};

type GameSessionState = {
  game: Game | null;
  playerName: string;
  selectedMode: GameMode;
  onlineSession: OnlineSessionState;
  startGame: (mode: GameMode, playerName: string) => void;
  playCell: (cellIndex: number) => void;
  newGame: () => void;
  changeMode: (mode: GameMode) => void;
  abandon: () => void;
  resetSession: () => void;
  createOnlineGame: (displayName: string) => Promise<void>;
  joinOnlineGame: (gameId: string, displayName: string) => Promise<void>;
  spectateOnlineGame: (gameId: string, displayName: string) => Promise<void>;
  playOnlineCell: (cellIndex: number) => Promise<void>;
  resignOnlineGame: () => Promise<void>;
  refreshOnlineGame: () => Promise<void>;
  checkOnlineAbandonment: () => Promise<void>;
  disconnectOnlineGame: () => void;
  recoverOnlineSession: () => Promise<void>;
};

type OnlineRecoveryState = {
  gameId: string;
  role: OnlineRole;
  playerMark: PlayerMark | null;
  displayName: string;
  latestSequence: number;
};

const ONLINE_RECOVERY_KEY = "tic-tac-toe-online-session";

let onlineSocket: OnlineSocket | null = null;

const closeOnlineSocket = () => {
  onlineSocket?.close();
  onlineSocket = null;
};

const createEmptyOnlineSession = (): OnlineSessionState => ({
  gameId: null,
  role: null,
  playerMark: null,
  playerToken: null,
  displayName: "",
  connectionStatus: "idle",
  latestSequence: 0,
  error: null,
});

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

const isOnlineRole = (value: unknown): value is OnlineRole =>
  value === "player" || value === "spectator";

const isPlayerMark = (value: unknown): value is PlayerMark => value === "X" || value === "O";

const readOnlineRecovery = (): OnlineSessionState => {
  const storage = getSessionStorage();
  if (storage === null) {
    return createEmptyOnlineSession();
  }

  const serialized = storage.getItem(ONLINE_RECOVERY_KEY);
  if (serialized === null) {
    return createEmptyOnlineSession();
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<OnlineRecoveryState>;

    if (
      typeof parsed.gameId !== "string" ||
      !isOnlineRole(parsed.role) ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.latestSequence !== "number"
    ) {
      storage.removeItem(ONLINE_RECOVERY_KEY);
      return createEmptyOnlineSession();
    }

    return {
      ...createEmptyOnlineSession(),
      gameId: parsed.gameId,
      role: parsed.role,
      playerMark: isPlayerMark(parsed.playerMark) ? parsed.playerMark : null,
      displayName: parsed.displayName,
      connectionStatus: "disconnected",
      latestSequence: parsed.latestSequence,
    };
  } catch {
    storage.removeItem(ONLINE_RECOVERY_KEY);
    return createEmptyOnlineSession();
  }
};

const persistOnlineRecovery = (session: OnlineSessionState) => {
  const storage = getSessionStorage();
  if (storage === null) {
    return;
  }

  if (session.gameId === null || session.role === null || session.displayName.length === 0) {
    storage.removeItem(ONLINE_RECOVERY_KEY);
    return;
  }

  const recoveryState: OnlineRecoveryState = {
    gameId: session.gameId,
    role: session.role,
    playerMark: session.playerMark,
    displayName: session.displayName,
    latestSequence: session.latestSequence,
  };

  storage.setItem(ONLINE_RECOVERY_KEY, JSON.stringify(recoveryState));
};

const clearOnlineRecovery = () => {
  getSessionStorage()?.removeItem(ONLINE_RECOVERY_KEY);
};

const errorToMessage = (error: unknown): string => {
  if (error instanceof ApiConfigurationError || error instanceof OnlineApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Online multiplayer request failed.";
};

const baseInitialState = {
  game: null,
  playerName: "",
  selectedMode: "player-vs-player" as GameMode,
};

export const useGameSessionStore = create<GameSessionState>((set, get) => {
  const updateOnlineSession = (patch: Partial<OnlineSessionState>) => {
    set((state) => {
      const onlineSession = {
        ...state.onlineSession,
        ...patch,
      };
      persistOnlineRecovery(onlineSession);

      return { onlineSession };
    });
  };

  const setOnlineGame = (game: Game) => {
    set((state) => {
      const onlineSession = {
        ...state.onlineSession,
        gameId: game.online?.id ?? state.onlineSession.gameId,
        latestSequence: game.online?.latestSequence ?? state.onlineSession.latestSequence,
        error: null,
      };
      persistOnlineRecovery(onlineSession);

      return {
        game,
        selectedMode: "online-multiplayer",
        onlineSession,
      };
    });
  };

  const handleSubscriptionConfirmed = async (
    latestSequence: number,
    wasReconnect: boolean,
  ) => {
    const { onlineSession } = get();
    if (onlineSession.gameId === null) {
      return;
    }

    try {
      let resolvedLatestSequence = latestSequence;

      if (wasReconnect) {
        const eventsResponse = await getOnlineEvents(
          onlineSession.gameId,
          onlineSession.latestSequence,
        );
        resolvedLatestSequence = Math.max(
          latestSequence,
          ...eventsResponse.events.map((event) => event.sequence),
        );
      }

      updateOnlineSession({
        latestSequence: resolvedLatestSequence,
        connectionStatus: "connected",
        error: null,
      });
      await get().refreshOnlineGame();
    } catch (error) {
      updateOnlineSession({ error: errorToMessage(error) });
    }
  };

  const connectOnlineSocket = (session: OnlineSessionState) => {
    closeOnlineSocket();

    if (session.gameId === null || session.role === null) {
      return;
    }

    if (session.role === "player" && session.playerToken === null) {
      updateOnlineSession({
        connectionStatus: "disconnected",
        error: "Player token is not available. Create or join the game again.",
      });
      return;
    }

    try {
      onlineSocket = openOnlineGameSocket(
        session.role === "player"
          ? {
              gameId: session.gameId,
              role: "player",
              playerToken: session.playerToken,
            }
          : {
              gameId: session.gameId,
              role: "spectator",
              displayName: session.displayName,
            },
        {
          onStatusChange: (connectionStatus) => {
            updateOnlineSession({ connectionStatus });
          },
          onSubscriptionConfirmed: (message, wasReconnect) => {
            void handleSubscriptionConfirmed(message.latestSequence, wasReconnect);
          },
          onGameEvent: (event) => {
            if (event.gameId !== get().onlineSession.gameId) {
              return;
            }

            updateOnlineSession({
              latestSequence: Math.max(get().onlineSession.latestSequence, event.sequence),
              error: null,
            });
            void get().refreshOnlineGame();
          },
          onError: (message) => {
            updateOnlineSession({ error: message });
          },
        },
      );
    } catch (error) {
      updateOnlineSession({
        connectionStatus: "disconnected",
        error: errorToMessage(error),
      });
    }
  };

  const startOnlineRequest = (displayName: string) => {
    closeOnlineSocket();
    const onlineSession = {
      ...createEmptyOnlineSession(),
      displayName,
      connectionStatus: "connecting" as OnlineConnectionStatus,
    };
    persistOnlineRecovery(onlineSession);
    set({
      game: null,
      playerName: displayName,
      selectedMode: "online-multiplayer",
      onlineSession,
    });
  };

  const applyPlayerOnlineSession = (
    displayName: string,
    game: Game,
    playerMark: PlayerMark,
    playerToken: string,
  ) => {
    const onlineSession = {
      ...createEmptyOnlineSession(),
      gameId: game.online?.id ?? null,
      role: "player" as OnlineRole,
      playerMark,
      playerToken,
      displayName,
      connectionStatus: "connecting" as OnlineConnectionStatus,
      latestSequence: game.online?.latestSequence ?? 0,
    };
    persistOnlineRecovery(onlineSession);
    set({
      game,
      playerName: displayName,
      selectedMode: "online-multiplayer",
      onlineSession,
    });
    connectOnlineSocket(onlineSession);
  };

  return {
    ...baseInitialState,
    onlineSession: readOnlineRecovery(),
    startGame: (mode, playerName) => {
      if (mode === "online-multiplayer") {
        return;
      }

      closeOnlineSocket();
      clearOnlineRecovery();
      set({
        game: createLocalGame(mode),
        playerName,
        selectedMode: mode,
        onlineSession: createEmptyOnlineSession(),
      });
    },
    playCell: (cellIndex) =>
      set((state) => ({
        ...state,
        game:
          state.game === null || state.game.mode === "online-multiplayer"
            ? state.game
            : playTurn(state.game, cellIndex),
      })),
    newGame: () =>
      set((state) => {
        if (state.game === null || state.selectedMode === "online-multiplayer") {
          return state;
        }

        return {
          ...state,
          game: createLocalGame(state.selectedMode),
        };
      }),
    changeMode: (mode) =>
      set((state) => {
        if (mode === "online-multiplayer") {
          closeOnlineSocket();
          clearOnlineRecovery();
          return {
            ...state,
            selectedMode: mode,
            game: null,
            onlineSession: createEmptyOnlineSession(),
          };
        }

        closeOnlineSocket();
        clearOnlineRecovery();
        return {
          ...state,
          selectedMode: mode,
          game: state.game === null ? null : createLocalGame(mode),
          onlineSession: createEmptyOnlineSession(),
        };
      }),
    abandon: () =>
      set((state) => ({
        ...state,
        game:
          state.game === null || state.game.mode === "online-multiplayer"
            ? state.game
            : abandonGame(state.game),
      })),
    resetSession: () => {
      closeOnlineSocket();
      clearOnlineRecovery();
      set({
        ...baseInitialState,
        onlineSession: createEmptyOnlineSession(),
      });
    },
    createOnlineGame: async (displayName) => {
      startOnlineRequest(displayName);

      try {
        const response = await createOnlineGameRequest(displayName);
        applyPlayerOnlineSession(
          response.player.displayName,
          normalizePublicGame(response.game),
          response.player.mark,
          response.player.playerToken,
        );
      } catch (error) {
        updateOnlineSession({
          connectionStatus: "disconnected",
          error: errorToMessage(error),
        });
      }
    },
    joinOnlineGame: async (gameId, displayName) => {
      startOnlineRequest(displayName);

      try {
        const response = await joinOnlineGameRequest(gameId, displayName);
        applyPlayerOnlineSession(
          response.player.displayName,
          normalizePublicGame(response.game),
          response.player.mark,
          response.player.playerToken,
        );
      } catch (error) {
        updateOnlineSession({
          connectionStatus: "disconnected",
          error: errorToMessage(error),
        });
      }
    },
    spectateOnlineGame: async (gameId, displayName) => {
      startOnlineRequest(displayName);

      try {
        const response = await getOnlineGame(gameId);
        const game = normalizePublicGame(response.game);
        const onlineSession = {
          ...createEmptyOnlineSession(),
          gameId: response.game.id,
          role: "spectator" as OnlineRole,
          displayName,
          connectionStatus: "connecting" as OnlineConnectionStatus,
          latestSequence: response.game.latestSequence,
        };
        persistOnlineRecovery(onlineSession);
        set({
          game,
          playerName: displayName,
          selectedMode: "online-multiplayer",
          onlineSession,
        });
        connectOnlineSocket(onlineSession);
      } catch (error) {
        updateOnlineSession({
          connectionStatus: "disconnected",
          error: errorToMessage(error),
        });
      }
    },
    playOnlineCell: async (cellIndex) => {
      const { game, onlineSession } = get();

      if (
        game === null ||
        game.mode !== "online-multiplayer" ||
        game.state !== "active" ||
        onlineSession.role !== "player" ||
        onlineSession.playerToken === null ||
        onlineSession.playerMark === null ||
        game.currentPlayer !== onlineSession.playerMark ||
        game.board[cellIndex] !== null ||
        onlineSession.gameId === null
      ) {
        return;
      }

      updateOnlineSession({ error: null });

      try {
        const response = await makeOnlineMove(
          onlineSession.gameId,
          onlineSession.playerToken,
          cellIndex,
        );
        setOnlineGame(normalizePublicGame(response.game));
      } catch (error) {
        updateOnlineSession({ error: errorToMessage(error) });
      }
    },
    resignOnlineGame: async () => {
      const { game, onlineSession } = get();

      if (
        game === null ||
        game.mode !== "online-multiplayer" ||
        game.state !== "active" ||
        onlineSession.role !== "player" ||
        onlineSession.playerToken === null ||
        onlineSession.gameId === null
      ) {
        return;
      }

      updateOnlineSession({ error: null });

      try {
        const response = await resignOnlineGameRequest(
          onlineSession.gameId,
          onlineSession.playerToken,
        );
        setOnlineGame(normalizePublicGame(response.game));
      } catch (error) {
        updateOnlineSession({ error: errorToMessage(error) });
      }
    },
    refreshOnlineGame: async () => {
      const { onlineSession } = get();
      if (onlineSession.gameId === null) {
        return;
      }

      try {
        const response = await getOnlineGame(onlineSession.gameId);
        setOnlineGame(normalizePublicGame(response.game));
      } catch (error) {
        updateOnlineSession({ error: errorToMessage(error) });
      }
    },
    checkOnlineAbandonment: async () => {
      const { onlineSession } = get();
      if (onlineSession.gameId === null || onlineSession.playerToken === null) {
        return;
      }

      try {
        const response = await checkOnlineAbandonment(
          onlineSession.gameId,
          onlineSession.playerToken,
        );
        setOnlineGame(normalizePublicGame(response.game));
      } catch (error) {
        updateOnlineSession({ error: errorToMessage(error) });
      }
    },
    disconnectOnlineGame: () => {
      closeOnlineSocket();
      clearOnlineRecovery();
      set({
        ...baseInitialState,
        onlineSession: createEmptyOnlineSession(),
      });
    },
    recoverOnlineSession: async () => {
      const { game, onlineSession } = get();
      if (game !== null || onlineSession.gameId === null || onlineSession.displayName.length === 0) {
        return;
      }

      set({
        playerName: onlineSession.displayName,
        selectedMode: "online-multiplayer",
      });

      try {
        const response = await getOnlineGame(onlineSession.gameId);
        setOnlineGame(normalizePublicGame(response.game));

        if (onlineSession.role === "spectator") {
          connectOnlineSocket({
            ...onlineSession,
            connectionStatus: "connecting",
          });
          return;
        }

        updateOnlineSession({
          connectionStatus: "disconnected",
          error:
            "Player token is kept in memory only. Create or join a game again to make player moves.",
        });
      } catch (error) {
        updateOnlineSession({
          connectionStatus: "disconnected",
          error: errorToMessage(error),
        });
      }
    },
  };
});
