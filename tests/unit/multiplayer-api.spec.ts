import { expect, test } from "@playwright/test";
import {
  checkMultiplayerAbandonment,
  createMultiplayerGame,
  getMultiplayerGame,
  getMultiplayerGameWithOptions,
  getMultiplayerWebSocketUrlFromBaseUrl,
  joinMultiplayerGame,
  listMultiplayerGames,
  readJsonResponse,
  resignMultiplayerGame,
  resolveApiBaseUrl,
  submitMultiplayerMove,
} from "../../src/multiplayer/api";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test.describe("multiplayer api helpers", () => {
  test("getMultiplayerWebSocketUrl uses ws for an http API base URL", () => {
    expect(getMultiplayerWebSocketUrlFromBaseUrl("http://localhost:3001", "game-1")).toBe(
      "ws://localhost:3001/ws?gameId=game-1"
    );
  });

  test("getMultiplayerWebSocketUrl uses wss for an https API base URL", () => {
    expect(getMultiplayerWebSocketUrlFromBaseUrl("https://api.example.com", "game-1")).toBe(
      "wss://api.example.com/ws?gameId=game-1"
    );
  });

  test("getMultiplayerWebSocketUrl trims trailing slashes from the configured API base URL", () => {
    expect(getMultiplayerWebSocketUrlFromBaseUrl("https://api.example.com///", "game-1")).toBe(
      "wss://api.example.com/ws?gameId=game-1"
    );
    expect(resolveApiBaseUrl("https://api.example.com///")).toBe("https://api.example.com");
  });

  test("readJsonResponse returns parsed JSON for successful responses", async () => {
    await expect(
      readJsonResponse<{ ok: boolean }>(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    ).resolves.toEqual({ ok: true });
  });

  test("readJsonResponse throws the server message for JSON error responses", async () => {
    await expect(
      readJsonResponse(
        new Response(JSON.stringify({ message: "Invalid move." }), {
          status: 409,
          headers: { "content-type": "application/json" },
        })
      )
    ).rejects.toThrow("Invalid move.");
  });

  test("readJsonResponse falls back to Request failed with status N for non-JSON error responses", async () => {
    await expect(
      readJsonResponse(new Response("not json", { status: 503 }))
    ).rejects.toThrow("Request failed with status 503.");
  });

  test("createMultiplayerGame POSTs the create payload as JSON to /games", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await createMultiplayerGame({ playerName: "Host", gameName: "Match One" });

    expect(requestUrl).toBe("http://localhost:3001/games");
    expect(requestInit).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerName: "Host", gameName: "Match One" }),
    });
  });

  test("listMultiplayerGames GETs /games with the requested status query parameter", async () => {
    let requestUrl = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestUrl = String(input);
      return new Response(JSON.stringify({ games: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await listMultiplayerGames("active");

    expect(requestUrl).toBe("http://localhost:3001/games?status=active");
  });

  test("getMultiplayerGame GETs /games/:id", async () => {
    let requestUrl = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestUrl = String(input);
      return new Response(JSON.stringify({ game: { id: "game-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await getMultiplayerGame("game-1");

    expect(requestUrl).toBe("http://localhost:3001/games/game-1");
  });

  test("getMultiplayerGameWithOptions includes reconnect query parameters when provided", async () => {
    let requestUrl = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestUrl = String(input);
      return new Response(JSON.stringify({ game: { id: "game-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await getMultiplayerGameWithOptions("game-1", {
      player: "X",
      intent: "reconnect",
    });

    expect(requestUrl).toBe(
      "http://localhost:3001/games/game-1?player=X&intent=reconnect"
    );
  });

  test("joinMultiplayerGame POSTs to /games/:id/join", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ game: {}, session: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await joinMultiplayerGame("game-1");

    expect(requestUrl).toBe("http://localhost:3001/games/game-1/join");
    expect(requestInit?.method).toBe("POST");
  });

  test("submitMultiplayerMove POSTs the move payload as JSON to /games/:id/moves", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ game: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await submitMultiplayerMove("game-1", { player: "X", position: 4 });

    expect(requestUrl).toBe("http://localhost:3001/games/game-1/moves");
    expect(requestInit).toMatchObject({
      method: "POST",
      body: JSON.stringify({ player: "X", position: 4 }),
    });
  });

  test("resignMultiplayerGame POSTs the resign payload as JSON to /games/:id/resign", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ game: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await resignMultiplayerGame("game-1", { player: "O" });

    expect(requestUrl).toBe("http://localhost:3001/games/game-1/resign");
    expect(requestInit).toMatchObject({
      method: "POST",
      body: JSON.stringify({ player: "O" }),
    });
  });

  test("checkMultiplayerAbandonment POSTs to /games/:id/abandonment-check", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ game: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    await checkMultiplayerAbandonment("game-1");

    expect(requestUrl).toBe("http://localhost:3001/games/game-1/abandonment-check");
    expect(requestInit?.method).toBe("POST");
  });
});
