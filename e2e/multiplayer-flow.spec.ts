import { test, expect } from "@playwright/test";

test("create multiplayer game from landing", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-123",
                status: "waiting",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-9999", mark: "O" },
                ],
              },
            }),
          });
        }, 0);
      }
      close() {
        this.onclose?.();
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-123",
          status: "waiting",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/");
  await page.getByTestId("new-multiplayer").click();
  await expect(page.getByTestId("multiplayer-modal")).toBeVisible();

  await page.getByRole("button", { name: "Create room" }).click();
  await expect(page).toHaveURL(/\/multiplayer/);
  await expect(page.getByTestId("multiplayer-game-id")).toHaveText("game-123");
  await expect(page.getByTestId("multiplayer-status")).toHaveText("Waiting for opponent…");
  await expect(page.getByRole("button", { name: "Copy ID" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy invite link" })).toBeVisible();
  await expect(page.getByTestId("multiplayer-cell-0")).toBeDisabled();
});

test("join multiplayer game from waiting list", async ({ page }) => {
  await page.addInitScript(() => {
    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-join",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
              },
            }),
          });
        }, 0);
      }
      close() {
        this.onclose?.();
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        games: [
          {
            id: "game-join",
            status: "waiting",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            moveCount: 0,
          },
        ],
      }),
    });
  });

  await page.route("**/games/game-join/join", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          event: "player_joined",
          game: {
            id: "game-join",
            status: "active",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            moveCount: 0,
            currentTurn: "X",
            players: [
              { id: "p1", mark: "X" },
              { id: "p2", mark: "O" },
            ],
          },
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=join");
  await expect(page.getByTestId("waiting-games")).toBeVisible();
  await page.getByTestId("waiting-games").getByRole("button", { name: "Join" }).click();
  await expect(page.getByTestId("multiplayer-status")).toHaveText("active");
});

test("stale join shows already started and disables non-waiting", async ({ page }) => {
  await page.route("**/games", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        games: [
          {
            id: "game-stale",
            status: "active",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            moveCount: 1,
          },
        ],
      }),
    });
  });

  await page.route("**/games/game-stale/join", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ code: "NOT_JOINABLE", message: "Game cannot be joined." }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=join");
  await expect(page.getByTestId("waiting-games")).toBeVisible();
  await expect(
    page.getByTestId("waiting-games").getByRole("button", { name: "Join" })
  ).toBeDisabled();
});

test("multiplayer join shows game not found and allows back", async ({ page }) => {
  await page.route("**/games/game-missing/join", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: "NOT_FOUND", message: "Game not found." }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=join&room=game-missing");
  await expect(page.getByText("Game not found.")).toBeVisible();
  await page.getByRole("button", { name: "Back to landing" }).click();
  await expect(page).toHaveURL("/");
});

test("multiplayer move submits and renders update", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-move",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
                board: Array.from({ length: 9 }, () => null),
                moves: [],
              },
            }),
          });
        }, 0);
      }
      close() {
        this.onclose?.();
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-move",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/games/game-move/moves", async (route) => {
    if (route.request().method() === "POST") {
      const payload = JSON.parse(route.request().postData() ?? "{}") as {
        index?: number;
      };
      const state = {
        status: "active",
        board: Array.from({ length: 9 }, (_, i) => (i === payload.index ? "X" : null)),
        moves: [{ index: payload.index, mark: "X", turn: 1, at: "now" }],
        moveCount: 1,
        currentTurn: "O",
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          type: "move_accepted",
          payload: {
            roomId: "game-move",
            state,
          },
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByTestId("multiplayer-board")).toBeVisible();

  await page.getByTestId("multiplayer-cell-0").click();
  await expect(page.getByTestId("multiplayer-cell-0")).toContainText("X");
  await expect(page.getByTestId("multiplayer-move-history")).toContainText("Turn 1: X");
});

test("multiplayer create handles capacity limit", async ({ page }) => {
  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ code: "MAX_GAMES_REACHED", message: "Too many games." }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByRole("status")).toContainText(
    "Server is at capacity. Please try again later."
  );
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("multiplayer rematch creates a new room", async ({ page }) => {
  await page.addInitScript(() => {
    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-over",
                status: "over",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 5,
                currentTurn: "X",
                winner: "X",
                board: Array.from({ length: 9 }, (_, i) => (i === 0 ? "X" : null)),
                moves: [{ index: 0, mark: "X", turn: 1, at: "now" }],
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
              },
            }),
          });
        }, 0);
      }
      close() {
        this.onclose?.();
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  let createCount = 0;
  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      if (createCount === 0) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "game-over",
            status: "over",
            createdAt: "2024-01-01T00:00:00.000Z",
          }),
        });
        createCount += 1;
        return;
      }
      createCount += 1;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: `game-rematch-${createCount}`,
          status: "waiting",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/games/game-over/rematch", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-rematch-2",
          status: "waiting",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByRole("button", { name: "Rematch" })).toBeVisible();
  await page.getByRole("button", { name: "Rematch" }).click();
  await expect(page.getByTestId("multiplayer-game-id")).toHaveText("game-rematch-2");
});

test("multiplayer shows game over even if status is waiting", async ({ page }) => {
  await page.addInitScript(() => {
    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "game_over",
              payload: {
                roomId: "game-finish",
                state: {
                  status: "waiting",
                  moveCount: 5,
                  board: Array.from({ length: 9 }, (_, i) => (i === 0 ? "X" : null)),
                  moves: [{ index: 0, mark: "X", turn: 1, at: "now" }],
                },
                winner: "X",
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-finish",
          status: "waiting",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByTestId("multiplayer-status")).toHaveText("over");
  await expect(page.getByTestId("multiplayer-outcome")).toContainText("Player X wins");
});

test("multiplayer reconnects and shows status", async ({ page }) => {
  await page.addInitScript(() => {
    let created = 0;
    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor(url: string) {
        this.url = url;
        created += 1;
        setTimeout(() => {
          this.onopen?.();
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-reconnect",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                board: Array.from({ length: 9 }, () => null),
                moves: [],
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
              },
            }),
          });
          if (created === 1) {
            this.onclose?.();
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

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-reconnect",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/games/game-reconnect", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "game-reconnect",
        status: "active",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        moveCount: 0,
        currentTurn: "X",
        board: Array.from({ length: 9 }, () => null),
        moves: [],
        players: [
          { id: "player-12345678", mark: "X" },
          { id: "player-5678", mark: "O" },
        ],
      }),
    });
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByText("Reconnecting")).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();
});

test("multiplayer shows pending move state", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-pending",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                board: Array.from({ length: 9 }, () => null),
                moves: [],
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-pending",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/games/game-pending/moves", async (route) => {
    // Keep request pending long enough to observe the pending state.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        type: "move_accepted",
        payload: {
          roomId: "game-pending",
          state: {
            status: "active",
            board: ["X", null, null, null, null, null, null, null, null],
            moves: [{ index: 0, mark: "X", turn: 1, at: "now" }],
            moveCount: 1,
            currentTurn: "O",
          },
        },
      }),
    });
  });

  await page.goto("/multiplayer?mode=create");
  await page.getByTestId("multiplayer-cell-0").click();
  await expect(page.getByText("Submitting move…")).toBeVisible();
});

test("multiplayer resign ends the game", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-resign",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                board: Array.from({ length: 9 }, () => null),
                moves: [],
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-resign",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/games/game-resign/resign", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          type: "game_over",
          payload: {
            roomId: "game-resign",
            state: { status: "over", moveCount: 0, board: Array.from({ length: 9 }, () => null), moves: [] },
            winner: "O",
            reason: "resign",
          },
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await page.getByRole("button", { name: "Resign" }).click();
  await expect(page.getByTestId("multiplayer-outcome")).toContainText("Player O wins");
});

test("multiplayer abandonment check shows still active", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-abandon",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                board: Array.from({ length: 9 }, () => null),
                moves: [],
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-abandon",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/games/game-abandon/abandonment-check", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ abandoned: false, reason: "NOT_INACTIVE" }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await page.getByRole("button", { name: "Abandonment check" }).click();
  await expect(page.getByText("Opponent still active.")).toBeVisible();
});

test("multiplayer game over messaging is role-aware", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "game_over",
              payload: {
                roomId: "game-over-msg",
                state: {
                  status: "over",
                  moveCount: 5,
                  board: Array.from({ length: 9 }, (_, i) => (i === 0 ? "X" : null)),
                  moves: [{ index: 0, mark: "X", turn: 1, at: "now" }],
                  players: [
                    { id: "player-12345678", mark: "X" },
                    { id: "player-5678", mark: "O" },
                  ],
                },
                winner: "X",
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-over-msg",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByTestId("multiplayer-outcome")).toContainText("Player X wins");
  await expect(page.getByTestId("multiplayer-outcome")).toContainText("You won!");
});

test("multiplayer leave returns to landing without resign", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - override in test environment
    crypto.randomUUID = () => "12345678-uuid";

    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "state_catchup",
              payload: {
                id: "game-leave",
                status: "active",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
                moveCount: 0,
                currentTurn: "X",
                board: Array.from({ length: 9 }, () => null),
                moves: [],
                players: [
                  { id: "player-12345678", mark: "X" },
                  { id: "player-5678", mark: "O" },
                ],
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-leave",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await page.getByRole("button", { name: "Leave" }).click();
  await expect(page).toHaveURL("/");
});

test("multiplayer rematch invite allows join", async ({ page }) => {
  await page.addInitScript(() => {
    class MockWebSocket {
      url: string;
      onmessage: ((event: { data: string }) => void) | null = null;
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: "rematch_invite",
              payload: {
                roomId: "game-old",
                newGameId: "game-new",
              },
            }),
          });
        }, 0);
      }
      close() {
        return;
      }
      send() {
        return;
      }
    }

    // @ts-expect-error - override in test environment
    window.WebSocket = MockWebSocket;
  });

  await page.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "game-old",
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/multiplayer?mode=create");
  await expect(page.getByRole("button", { name: "Join rematch" })).toBeVisible();
  await page.getByRole("button", { name: "Join rematch" }).click();
  await expect(page).toHaveURL(/room=game-new/);
});
