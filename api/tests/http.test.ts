import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMocks = vi.hoisted(() => ({
  createGameRecord: vi.fn(),
  getEvents: vi.fn(),
  getGame: vi.fn(),
  getGameAndEvents: vi.fn(),
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

  it("validates afterSequence when fetching events", async () => {
    const response = await handler(
      makeEvent("GET", "/api/games/game_1/events", undefined, { afterSequence: "-1" }),
    );

    expect(response.statusCode).toBe(400);
    expect(parseBody(response).error.code).toBe("BAD_REQUEST");
    expect(storeMocks.getEvents).not.toHaveBeenCalled();
  });
});
