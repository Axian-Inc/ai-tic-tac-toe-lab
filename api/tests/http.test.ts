import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  createGameRecord: vi.fn(),
  getEvents: vi.fn(),
  getGame: vi.fn(),
  getGameAndEvents: vi.fn(),
  listInProgressGames: vi.fn(),
  saveGameMutation: vi.fn(),
}));

const realtimeMocks = vi.hoisted(() => ({
  broadcastEvents: vi.fn(),
}));

vi.mock("../src/store.js", () => storeMocks);
vi.mock("../src/realtime.js", () => realtimeMocks);

const { handler } = await import("../src/handlers/http.js");

const makeEvent = (
  method: string,
  rawPath: string,
  body?: unknown,
  queryStringParameters?: Record<string, string>,
): APIGatewayProxyEventV2 =>
  ({
    rawPath,
    body: body === undefined ? undefined : JSON.stringify(body),
    queryStringParameters,
    requestContext: {
      http: {
        method,
      },
    },
  }) as APIGatewayProxyEventV2;

const parseBody = (response: { body?: string }) => JSON.parse(response.body ?? "{}");

const iso = "2026-04-27T00:00:00.000Z";

const makeStoredGame = (id: string, state: "waiting_for_players" | "active") => ({
  id,
  state,
  board: Array(9).fill(null),
  currentTurn: state === "active" ? "X" : null,
  winner: null,
  players: {
    X: {
      mark: "X",
      displayName: "alice",
      playerTokenHash: "secret-token-hash",
      joinedAt: iso,
    },
  },
  moveHistory: [
    {
      moveNumber: 1,
      playerMark: "X",
      displayName: "alice",
      cellIndex: 0,
      createdAt: iso,
    },
  ],
  createdAt: iso,
  updatedAt: iso,
  startedAt: state === "active" ? iso : null,
  endedAt: null,
  lastMoveAt: state === "active" ? iso : null,
  abandonmentDeadlineAt: state === "active" ? "2026-04-27T00:03:00.000Z" : null,
  latestSequence: state === "active" ? 3 : 1,
});

describe("http handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns health status", async () => {
    const response = await handler(makeEvent("GET", "/api/health"));

    expect(response.statusCode).toBe(200);
    expect(parseBody(response)).toEqual({ status: "ok" });
  });

  it("rejects invalid display names on create", async () => {
    const response = await handler(makeEvent("POST", "/api/games", { displayName: "bad name" }));

    expect(response.statusCode).toBe(400);
    expect(parseBody(response).error.code).toBe("INVALID_DISPLAY_NAME");
    expect(storeMocks.createGameRecord).not.toHaveBeenCalled();
  });

  it("creates a game and returns the issued player token", async () => {
    storeMocks.createGameRecord.mockResolvedValue(undefined);

    const response = await handler(makeEvent("POST", "/api/games", { displayName: "bob_123" }));
    const body = parseBody(response);

    expect(response.statusCode).toBe(201);
    expect(body.game.state).toBe("waiting_for_players");
    expect(body.game.board).toEqual(Array(9).fill(null));
    expect(body.player.displayName).toBe("bob_123");
    expect(body.player.playerToken).toEqual(expect.any(String));
    expect(storeMocks.createGameRecord).toHaveBeenCalledOnce();
  });

  it("returns public summaries for in-progress games", async () => {
    storeMocks.listInProgressGames.mockResolvedValue([
      makeStoredGame("game_waiting", "waiting_for_players"),
      makeStoredGame("game_active", "active"),
    ]);

    const response = await handler(makeEvent("GET", "/api/games"));
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body.games).toEqual([
      expect.objectContaining({
        id: "game_waiting",
        state: "waiting_for_players",
        currentTurn: null,
        moveCount: 1,
        latestSequence: 1,
      }),
      expect.objectContaining({
        id: "game_active",
        state: "active",
        currentTurn: "X",
        moveCount: 1,
        latestSequence: 3,
      }),
    ]);
    expect(body.games[0].players.X).toEqual({
      mark: "X",
      displayName: "alice",
      joinedAt: iso,
    });
    expect(body.games[0]).not.toHaveProperty("board");
    expect(body.games[0]).not.toHaveProperty("moveHistory");
    expect(body.games[0]).not.toHaveProperty("eventHistory");
    expect(body.games[0].players.X).not.toHaveProperty("playerTokenHash");
  });

  it("validates afterSequence when fetching events", async () => {
    const response = await handler(
      makeEvent("GET", "/api/games/game_1/events", undefined, { afterSequence: "-1" }),
    );

    expect(response.statusCode).toBe(400);
    expect(parseBody(response).error.code).toBe("BAD_REQUEST");
    expect(storeMocks.getEvents).not.toHaveBeenCalled();
  });
});
