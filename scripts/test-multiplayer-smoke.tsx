import { JSDOM } from "jsdom";
import React from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MultiplayerPage from "../src/pages/MultiplayerPage";

type FetchHandler = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

function setupDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
}

class MockWebSocket {
  static messages: unknown[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(url: string) {
    void url;
    setTimeout(() => {
      this.onopen?.();
      for (const message of MockWebSocket.messages) {
        this.onmessage?.({ data: JSON.stringify(message) });
      }
    }, 0);
  }
  close() {
    this.onclose?.();
  }
  send() {
    return;
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  } finally {
    cleanup();
  }
}

async function main() {
  setupDom();
  (globalThis as unknown as { importMeta?: { env?: Record<string, string> } }).importMeta = {
    env: {},
  };

  await runTest("create game success", async () => {
    globalThis.fetch = (async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/games") && init?.method === "POST") {
        return jsonResponse({
          id: "game-1",
          status: "waiting",
          createdAt: "2024-01-01T00:00:00.000Z",
        }, { status: 201 });
      }
      return jsonResponse({}, { status: 404 });
    }) as FetchHandler;

    MockWebSocket.messages = [
      {
        type: "state_catchup",
        payload: {
          id: "game-1",
          status: "waiting",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          moveCount: 0,
          currentTurn: "X",
          players: [{ id: "player-123", mark: "X" }],
          moves: [],
          board: Array.from({ length: 9 }, () => null),
        },
      },
    ];
    // @ts-expect-error - test mock
    globalThis.WebSocket = MockWebSocket;

    const { getByText } = render(
      <MemoryRouter initialEntries={["/multiplayer?mode=create"]}>
        <MultiplayerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      assert(getByText("game-1") !== null, "Expected game id to render");
    });
  });

  await runTest("create game 429 shows error", async () => {
    globalThis.fetch = (async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/games") && init?.method === "POST") {
        return jsonResponse({ code: "MAX_GAMES_REACHED" }, { status: 429 });
      }
      return jsonResponse({}, { status: 404 });
    }) as FetchHandler;

    MockWebSocket.messages = [];
    // @ts-expect-error - test mock
    globalThis.WebSocket = MockWebSocket;

    const { getByText } = render(
      <MemoryRouter initialEntries={["/multiplayer?mode=create"]}>
        <MultiplayerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      assert(
        getByText("Server is at capacity. Please try again later.") !== null,
        "Expected capacity error"
      );
    });
  });

  await runTest("join list renders waiting games", async () => {
    globalThis.fetch = (async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/games") && (!init || init.method === "GET")) {
        return jsonResponse({
          games: [
            {
              id: "game-waiting",
              status: "waiting",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
              moveCount: 0,
            },
          ],
        });
      }
      return jsonResponse({}, { status: 404 });
    }) as FetchHandler;

    MockWebSocket.messages = [];
    // @ts-expect-error - test mock
    globalThis.WebSocket = MockWebSocket;

    const { getByText } = render(
      <MemoryRouter initialEntries={["/multiplayer?mode=join"]}>
        <MultiplayerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      assert(getByText("game-waiting") !== null, "Expected waiting game id");
    });
  });

  await runTest("ws event updates move history", async () => {
    globalThis.fetch = (async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.endsWith("/games") && init?.method === "POST") {
        return jsonResponse({
          id: "game-ws",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }, { status: 201 });
      }
      return jsonResponse({}, { status: 404 });
    }) as FetchHandler;

    MockWebSocket.messages = [
      {
        type: "state_catchup",
        payload: {
          id: "game-ws",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          moveCount: 0,
          currentTurn: "X",
          players: [
            { id: "player-123", mark: "X" },
            { id: "player-456", mark: "O" },
          ],
          moves: [],
          board: Array.from({ length: 9 }, () => null),
        },
      },
      {
        type: "move_accepted",
        payload: {
          roomId: "game-ws",
          state: {
            status: "active",
            moveCount: 1,
            currentTurn: "O",
            moves: [{ index: 0, mark: "X", turn: 1, at: "now" }],
            board: ["X", null, null, null, null, null, null, null, null],
          },
        },
      },
    ];
    // @ts-expect-error - test mock
    globalThis.WebSocket = MockWebSocket;

    const { getByText } = render(
      <MemoryRouter initialEntries={["/multiplayer?mode=create"]}>
        <MultiplayerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      assert(getByText("Turn 1: X → 1") !== null, "Expected move history update");
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
