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

test("multiplayer disables moves while pending", async ({ page }) => {
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
  await expect(page.getByTestId("multiplayer-cell-1")).toBeDisabled();
});

test("multiplayer realtime win across two contexts", async ({ browser }) => {
  const gameId = "game-e2e";
  const createdAt = "2024-01-01T00:00:00.000Z";
  const creatorUuid = "creator12345678-uuid";
  const joinerUuid = "joiner12345678-uuid";
  const creatorId = "player-creator1";
  const joinerId = "player-joiner12";
  const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const state = {
    id: gameId,
    status: "waiting",
    createdAt,
    updatedAt: createdAt,
    lastMoveAt: createdAt,
    moveCount: 0,
    currentTurn: "X",
    players: [{ id: creatorId, mark: "X" }],
    moves: [] as { index: number; mark: string; turn: number; at: string }[],
    board: Array.from({ length: 9 }, () => null) as (string | null)[],
    winner: null as string | null,
  };

  const applyMove = (playerId: string, index: number) => {
    const player = state.players.find((entry) => entry.id === playerId);
    if (!player) {
      return { status: 403, body: { code: "PLAYER_NOT_IN_GAME" } };
    }
    if (state.status !== "active") {
      return { status: 409, body: { code: "GAME_NOT_ACTIVE" } };
    }
    if (player.mark !== state.currentTurn) {
      return { status: 409, body: { code: "NOT_YOUR_TURN" } };
    }
    if (state.board[index] !== null) {
      return { status: 409, body: { code: "CELL_OCCUPIED" } };
    }
    state.board[index] = player.mark;
    state.moveCount += 1;
    state.moves.push({
      index,
      mark: player.mark,
      turn: state.moveCount,
      at: new Date().toISOString(),
    });
    const winner = winningLines.find((line) =>
      line.every((idx) => state.board[idx] === player.mark)
    )
      ? player.mark
      : null;
    const isDraw = !winner && state.moveCount >= 9;
    state.status = winner || isDraw ? "over" : "active";
    state.winner = winner;
    state.currentTurn = player.mark === "X" ? "O" : "X";
    state.updatedAt = new Date().toISOString();
    state.lastMoveAt = state.updatedAt;
    return {
      status: 200,
      body: {
        type: "move_accepted",
        payload: {
          roomId: state.id,
          state: {
            status: state.status,
            board: [...state.board],
            moves: [...state.moves],
            moveCount: state.moveCount,
            currentTurn: state.currentTurn,
            winner: state.winner,
          },
        },
      },
    };
  };

  const createContext = async (uuid: string) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(({ id }) => {
      // @ts-expect-error - override in test environment
      crypto.randomUUID = () => id;

      class MockWebSocket {
        url: string;
        onmessage: ((event: { data: string }) => void) | null = null;
        onopen: (() => void) | null = null;
        onclose: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(url: string) {
          this.url = url;
          (window as { __wsInstance?: MockWebSocket }).__wsInstance = this;
          setTimeout(() => this.onopen?.(), 0);
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
      (window as { __emitWsMessage?: (payload: unknown) => void }).__emitWsMessage = (
        payload
      ) => {
        const ws = (window as { __wsInstance?: MockWebSocket }).__wsInstance;
        ws?.onmessage?.({ data: JSON.stringify(payload) });
      };
    }, { id: uuid });
    return { context, page };
  };

  const { context: creatorContext, page: creatorPage } = await createContext(creatorUuid);
  const { context: joinerContext, page: joinerPage } = await createContext(joinerUuid);

  await creatorPage.route("**/games", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: gameId, status: "waiting", createdAt }),
      });
      return;
    }
    await route.fallback();
  });

  const routeMoves = async (page: typeof creatorPage, otherPage: typeof joinerPage) => {
    await page.route(`**/games/${gameId}/moves`, async (route) => {
      const payload = JSON.parse(route.request().postData() ?? "{}") as {
        index?: number;
        playerId?: string;
      };
      const result = applyMove(payload.playerId ?? "", payload.index ?? -1);
      await route.fulfill({
        status: result.status,
        contentType: "application/json",
        body: JSON.stringify(result.body),
      });
      if (result.status === 200) {
        await otherPage.evaluate((message) => {
          (window as { __emitWsMessage?: (payload: unknown) => void }).__emitWsMessage?.(
            message
          );
        }, result.body);
      }
    });
  };

  await routeMoves(creatorPage, joinerPage);
  await routeMoves(joinerPage, creatorPage);

  await joinerPage.route(`**/games/${gameId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: state.id,
        status: state.status,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        lastMoveAt: state.lastMoveAt,
        moveCount: state.moveCount,
        currentTurn: state.currentTurn,
        players: state.players,
        moves: state.moves,
        board: state.board,
        winner: state.winner,
      }),
    });
  });

  await joinerPage.route(`**/games/${gameId}/join`, async (route) => {
    state.status = "active";
    state.players = [
      { id: creatorId, mark: "X" },
      { id: joinerId, mark: "O" },
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        event: "player_joined",
        game: {
          id: state.id,
          status: state.status,
          createdAt: state.createdAt,
          updatedAt: state.updatedAt,
          lastMoveAt: state.lastMoveAt,
          moveCount: state.moveCount,
          currentTurn: state.currentTurn,
          players: state.players,
          moves: state.moves,
          board: state.board,
          winner: state.winner,
        },
      }),
    });
    await creatorPage.evaluate((message) => {
      (window as { __emitWsMessage?: (payload: unknown) => void }).__emitWsMessage?.(message);
    }, {
      type: "player_joined",
      payload: {
        roomId: state.id,
        state: {
          status: state.status,
          board: state.board,
          moves: state.moves,
          moveCount: state.moveCount,
          currentTurn: state.currentTurn,
        },
        players: state.players,
      },
    });
  });

  await creatorPage.goto("/multiplayer?mode=create");
  await creatorPage.waitForFunction(
    () =>
      typeof (window as { __emitWsMessage?: (payload: unknown) => void }).__emitWsMessage ===
        "function"
  );
  await creatorPage.evaluate((payload) => {
    (window as { __emitWsMessage?: (message: unknown) => void }).__emitWsMessage?.(payload);
  }, {
    type: "state_catchup",
    payload: {
      id: state.id,
      status: state.status,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      lastMoveAt: state.lastMoveAt,
      moveCount: state.moveCount,
      currentTurn: state.currentTurn,
      players: state.players,
      board: state.board,
      moves: state.moves,
    },
  });

  await joinerPage.goto(`/multiplayer?mode=join&room=${gameId}`);
  await joinerPage.waitForFunction(
    () =>
      typeof (window as { __emitWsMessage?: (payload: unknown) => void }).__emitWsMessage ===
        "function"
  );
  await joinerPage.evaluate((payload) => {
    (window as { __emitWsMessage?: (message: unknown) => void }).__emitWsMessage?.(payload);
  }, {
    type: "state_catchup",
    payload: {
      id: state.id,
      status: state.status,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      lastMoveAt: state.lastMoveAt,
      moveCount: state.moveCount,
      currentTurn: state.currentTurn,
      players: state.players,
      board: state.board,
      moves: state.moves,
    },
  });

  await expect(creatorPage.getByTestId("multiplayer-status")).toHaveText("active");
  await expect(joinerPage.getByTestId("multiplayer-status")).toHaveText("active");
  await expect(creatorPage.getByText("You are")).toBeVisible();
  await expect(creatorPage.getByText("Player X")).toBeVisible();
  await expect(joinerPage.getByText("Player O")).toBeVisible();

  await creatorPage.getByTestId("multiplayer-cell-0").click();
  await expect(joinerPage.getByTestId("multiplayer-cell-0")).toContainText("X");

  await joinerPage.getByTestId("multiplayer-cell-3").click();
  await expect(creatorPage.getByTestId("multiplayer-cell-3")).toContainText("O");

  await creatorPage.getByTestId("multiplayer-cell-1").click();
  await expect(joinerPage.getByTestId("multiplayer-cell-1")).toContainText("X");

  await joinerPage.getByTestId("multiplayer-cell-4").click();
  await expect(creatorPage.getByTestId("multiplayer-cell-4")).toContainText("O");

  await creatorPage.getByTestId("multiplayer-cell-2").click();
  await expect(creatorPage.getByTestId("multiplayer-outcome")).toContainText("Player X wins");
  await expect(joinerPage.getByTestId("multiplayer-outcome")).toContainText("Player X wins");

  await creatorContext.close();
  await joinerContext.close();
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
