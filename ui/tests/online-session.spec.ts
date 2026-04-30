import { expect, test } from "./coverage";
import { listGames } from "../src/api/client";
import {
  normalizePublicGame,
  type GameEvent,
  type PublicGame,
  type PublicGameSummary,
} from "../src/api/types";
import { useGameSessionStore } from "../src/store/gameSession";
import { getPlayerNameError } from "../src/validation";

type RuntimeConfig = typeof globalThis & {
  __TICTACTOE_API_HTTP_URL__?: string;
  __TICTACTOE_API_WS_URL__?: string;
};

type FetchCall = {
  url: string;
  method: string;
  body: unknown;
};

type FakeMessageEvent = {
  data: string;
};

type FakeCloseEvent = Record<string, never>;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  readonly sent: string[] = [];
  private readonly listeners = new Map<string, Array<(event: FakeMessageEvent | FakeCloseEvent) => void>>();

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
    globalThis.setTimeout(() => this.emit("open", {}), 0);
  }

  addEventListener(type: string, listener: (event: FakeMessageEvent | FakeCloseEvent) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.emit("close", {});
  }

  emitMessage(message: unknown) {
    this.emit("message", { data: JSON.stringify(message) });
  }

  private emit(type: string, event: FakeMessageEvent | FakeCloseEvent) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

const originalFetch = globalThis.fetch;
const originalWebSocket = globalThis.WebSocket;
const runtimeConfig = globalThis as RuntimeConfig;

const iso = "2026-04-27T00:00:00.000Z";

const makePublicGame = (overrides: Partial<PublicGame> = {}): PublicGame => ({
  id: "game_1",
  state: "waiting_for_players",
  board: Array(9).fill(null),
  currentTurn: null,
  winner: null,
  players: {
    X: {
      mark: "X",
      displayName: "Alice",
      joinedAt: iso,
    },
  },
  moveHistory: [],
  createdAt: iso,
  updatedAt: iso,
  startedAt: null,
  endedAt: null,
  lastMoveAt: null,
  abandonmentDeadlineAt: null,
  latestSequence: 1,
  eventHistory: [],
  ...overrides,
});

const makePublicGameSummary = (
  overrides: Partial<PublicGameSummary> = {},
): PublicGameSummary => ({
  id: "game_1",
  state: "waiting_for_players",
  currentTurn: null,
  players: {
    X: {
      mark: "X",
      displayName: "Alice",
      joinedAt: iso,
    },
  },
  moveCount: 0,
  createdAt: iso,
  updatedAt: iso,
  startedAt: null,
  latestSequence: 1,
  ...overrides,
});

const makeEvent = (type: GameEvent["type"], sequence: number): GameEvent => ({
  gameId: "game_1",
  sequence,
  type,
  createdAt: iso,
  payload: {},
});

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const installOnlineMocks = (getCurrentGame: () => PublicGame, calls: FetchCall[]) => {
  runtimeConfig.__TICTACTOE_API_HTTP_URL__ = "http://api.test";
  runtimeConfig.__TICTACTOE_API_WS_URL__ = "ws://api.test/ws";
  globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body =
      init?.body === undefined ? null : (JSON.parse(String(init.body)) as Record<string, unknown>);
    calls.push({ url, method, body });

    if (url === "http://api.test/api/games" && method === "POST") {
      return jsonResponse({
        game: getCurrentGame(),
        player: { mark: "X", displayName: "Alice", playerToken: "token_x" },
      });
    }

    if (url === "http://api.test/api/games" && method === "GET") {
      return jsonResponse({
        games: [
          makePublicGameSummary(),
          makePublicGameSummary({
            id: "game_2",
            state: "active",
            currentTurn: "O",
            moveCount: 3,
            startedAt: iso,
            latestSequence: 5,
          }),
        ],
      });
    }

    if (url === "http://api.test/api/games/game_1/join" && method === "POST") {
      return jsonResponse({
        game: getCurrentGame(),
        player: { mark: "O", displayName: "Bob", playerToken: "token_o" },
      });
    }

    if (url === "http://api.test/api/games/game_1/moves" && method === "POST") {
      return jsonResponse({
        accepted: true,
        game: getCurrentGame(),
        move: {
          moveNumber: 1,
          playerMark: "O",
          displayName: "Bob",
          cellIndex: body?.cellIndex,
          createdAt: iso,
        },
      });
    }

    if (url.startsWith("http://api.test/api/games/game_1/events")) {
      return jsonResponse({ events: [] });
    }

    if (url === "http://api.test/api/games/game_1") {
      return jsonResponse({ game: getCurrentGame() });
    }

    return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found." } }, 404);
  };
};

test.beforeEach(() => {
  FakeWebSocket.instances = [];
  useGameSessionStore.getState().resetSession();
});

test.afterEach(() => {
  useGameSessionStore.getState().resetSession();
  globalThis.fetch = originalFetch;
  globalThis.WebSocket = originalWebSocket;
  delete runtimeConfig.__TICTACTOE_API_HTTP_URL__;
  delete runtimeConfig.__TICTACTOE_API_WS_URL__;
});

test("display-name validation accepts underscores and hyphens", () => {
  expect(getPlayerNameError("Alex_99")).toBeNull();
  expect(getPlayerNameError("Alex-99")).toBeNull();
  expect(getPlayerNameError("bad name")).toBe(
    "Use letters, numbers, underscores, or hyphens only.",
  );
});

test("normalizes backend online state into the UI game shape", () => {
  const game = normalizePublicGame(
    makePublicGame({
      state: "resigned",
      winner: "O",
      currentTurn: null,
      latestSequence: 7,
    }),
  );

  expect(game.mode).toBe("online-multiplayer");
  expect(game.state).toBe("resigned");
  expect(game.currentPlayer).toBe("O");
  expect(game.online?.currentTurn).toBeNull();
  expect(game.online?.latestSequence).toBe(7);
});

test("lists public in-progress online game summaries", async () => {
  const calls: FetchCall[] = [];
  installOnlineMocks(() => makePublicGame(), calls);

  const response = await listGames();

  expect(response.games).toEqual([
    expect.objectContaining({
      id: "game_1",
      state: "waiting_for_players",
      moveCount: 0,
      latestSequence: 1,
    }),
    expect.objectContaining({
      id: "game_2",
      state: "active",
      currentTurn: "O",
      moveCount: 3,
      latestSequence: 5,
    }),
  ]);
  expect(calls.some((call) => call.url === "http://api.test/api/games")).toBeTruthy();
});

test("refreshes a created online game when a join event arrives", async () => {
  let currentGame = makePublicGame();
  const calls: FetchCall[] = [];
  installOnlineMocks(() => currentGame, calls);

  await useGameSessionStore.getState().createOnlineGame("Alice");
  await expect.poll(() => FakeWebSocket.instances[0]?.sent.length ?? 0).toBe(1);

  FakeWebSocket.instances[0].emitMessage({
    type: "subscription.confirmed",
    gameId: "game_1",
    role: "player",
    playerMark: "X",
    latestSequence: 1,
  });
  await expect.poll(() => useGameSessionStore.getState().onlineSession.connectionStatus).toBe(
    "connected",
  );

  currentGame = makePublicGame({
    state: "active",
    currentTurn: "X",
    players: {
      X: { mark: "X", displayName: "Alice", joinedAt: iso },
      O: { mark: "O", displayName: "Bob", joinedAt: iso },
    },
    startedAt: iso,
    latestSequence: 2,
  });
  FakeWebSocket.instances[0].emitMessage(makeEvent("game.joined", 2));

  await expect.poll(() => useGameSessionStore.getState().game?.state).toBe("active");
  expect(useGameSessionStore.getState().game?.online?.players.O?.displayName).toBe("Bob");
  expect(calls.some((call) => call.url === "http://api.test/api/games/game_1")).toBeTruthy();
});

test("spectators subscribe and see moves without being able to submit moves", async () => {
  let currentGame = makePublicGame({
    state: "active",
    currentTurn: "X",
    players: {
      X: { mark: "X", displayName: "Alice", joinedAt: iso },
      O: { mark: "O", displayName: "Bob", joinedAt: iso },
    },
    startedAt: iso,
  });
  const calls: FetchCall[] = [];
  installOnlineMocks(() => currentGame, calls);

  await useGameSessionStore.getState().spectateOnlineGame("game_1", "Spec_1");
  await expect.poll(() => FakeWebSocket.instances[0]?.sent.length ?? 0).toBe(1);
  expect(JSON.parse(FakeWebSocket.instances[0].sent[0])).toEqual({
    type: "subscribe",
    gameId: "game_1",
    role: "spectator",
    displayName: "Spec_1",
  });

  await useGameSessionStore.getState().playOnlineCell(0);
  expect(calls.some((call) => call.url.endsWith("/moves"))).toBeFalsy();

  currentGame = makePublicGame({
    ...currentGame,
    board: ["X", null, null, null, null, null, null, null, null],
    currentTurn: "O",
    moveHistory: [
      {
        moveNumber: 1,
        playerMark: "X",
        displayName: "Alice",
        cellIndex: 0,
        createdAt: iso,
      },
    ],
    latestSequence: 2,
  });
  FakeWebSocket.instances[0].emitMessage(makeEvent("move.accepted", 2));

  await expect.poll(() => useGameSessionStore.getState().game?.board[0]).toBe("X");
});

test("player moves post to the API and keep the board authoritative from refreshes", async () => {
  let currentGame = makePublicGame({
    state: "active",
    currentTurn: "O",
    players: {
      X: { mark: "X", displayName: "Alice", joinedAt: iso },
      O: { mark: "O", displayName: "Bob", joinedAt: iso },
    },
    startedAt: iso,
  });
  const calls: FetchCall[] = [];
  installOnlineMocks(() => currentGame, calls);

  await useGameSessionStore.getState().joinOnlineGame("game_1", "Bob");
  await expect.poll(() => FakeWebSocket.instances[0]?.sent.length ?? 0).toBe(1);
  FakeWebSocket.instances[0].emitMessage({
    type: "subscription.confirmed",
    gameId: "game_1",
    role: "player",
    playerMark: "O",
    latestSequence: 1,
  });
  await expect.poll(() => useGameSessionStore.getState().onlineSession.connectionStatus).toBe(
    "connected",
  );

  currentGame = makePublicGame({
    ...currentGame,
    board: ["O", null, null, null, null, null, null, null, null],
    currentTurn: "X",
    moveHistory: [
      {
        moveNumber: 1,
        playerMark: "O",
        displayName: "Bob",
        cellIndex: 0,
        createdAt: iso,
      },
    ],
    latestSequence: 2,
  });

  await useGameSessionStore.getState().playOnlineCell(0);
  const moveCall = calls.find((call) => call.url === "http://api.test/api/games/game_1/moves");

  expect(moveCall?.method).toBe("POST");
  expect(moveCall?.body).toEqual({ playerToken: "token_o", cellIndex: 0 });

  FakeWebSocket.instances[0].emitMessage(makeEvent("move.accepted", 2));
  await expect.poll(() => useGameSessionStore.getState().game?.board[0]).toBe("O");
  expect(useGameSessionStore.getState().onlineSession.latestSequence).toBe(2);
});
