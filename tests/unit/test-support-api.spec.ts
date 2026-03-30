import { expect, test } from "@playwright/test";
import { TestSupportApi } from "../e2e/support/TestSupportApi";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test.describe("TestSupportApi", () => {
  test("seedGame posts a snapshot payload to the backend test-support endpoint", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const api = new TestSupportApi();
    await api.seedGame({
      id: "game-1",
      name: "Automation Seed",
      status: "waiting",
      createdAt: "2026-03-30T12:00:00.000Z",
      updatedAt: "2026-03-30T12:00:00.000Z",
      hostName: "Host",
      openSeatCount: 1,
      players: {
        X: {
          player: "X",
          name: "Host",
          joinedAt: "2026-03-30T12:00:00.000Z",
        },
        O: null,
      },
      state: {
        board: [null, null, null, null, null, null, null, null, null],
        currentPlayer: "X",
        moves: [],
        status: {
          isDraw: false,
          isOver: false,
          winner: null,
        },
      },
      completion: null,
      history: {
        retention: {
          mode: "process-memory",
          survivesServiceRestart: false,
        },
        events: [
          {
            type: "game-created",
            sequence: 1,
            occurredAt: "2026-03-30T12:00:00.000Z",
            player: "X",
          },
        ],
      },
      activity: {
        lastProgressedAt: "2026-03-30T12:00:00.000Z",
        awaitingPlayer: null,
        awaitingSince: null,
        abandonmentTimeoutMs: 180000,
        abandonmentDeadlineAt: null,
      },
    });

    expect(requestUrl).toBe("http://127.0.0.1:3001/test-support/seed/game");
    expect(requestInit).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
    });
  });

  test("forceFailure posts the configured target and error response metadata", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const api = new TestSupportApi();
    await api.forceFailure("detail", 503, "Forced detail failure");

    expect(requestUrl).toBe("http://127.0.0.1:3001/test-support/force-failure");
    expect(requestInit).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        target: "detail",
        statusCode: 503,
        message: "Forced detail failure",
      }),
    });
  });

  test("seedStaleJoin posts deterministic stale-join seed options to the backend test-support endpoint", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const api = new TestSupportApi();
    await api.seedStaleJoin({
      gameId: "stale-join-1",
      gameName: "Busy Match",
      hostName: "Host",
    });

    expect(requestUrl).toBe("http://127.0.0.1:3001/test-support/seed/stale-join");
    expect(requestInit).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        gameId: "stale-join-1",
        gameName: "Busy Match",
        hostName: "Host",
      }),
    });
  });
});
