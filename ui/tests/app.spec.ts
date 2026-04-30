import { expect, test } from "./coverage";

const mockRandomSequenceOnLoad = async (
  page: import("@playwright/test").Page,
  values: number[],
) => {
  await page.addInitScript((sequence) => {
    let index = 0;
    const originalRandom = Math.random;

    Math.random = () => {
      const next = sequence[index];
      index += 1;
      return next ?? originalRandom();
    };
  }, values);
};

const setRandomSequence = async (
  page: import("@playwright/test").Page,
  values: number[],
) => {
  await page.evaluate((sequence) => {
    let index = 0;
    const originalRandom = Math.random;

    Math.random = () => {
      const next = sequence[index];
      index += 1;
      return next ?? originalRandom();
    };
  }, values);
};

const startGame = async (
  page: import("@playwright/test").Page,
  options?: {
    name?: string;
    mode?: "player-vs-player" | "player-vs-cpu";
    randomBeforeStart?: number[];
  },
) => {
  const { name = "Alex99", mode = "player-vs-player", randomBeforeStart } = options ?? {};

  await page.goto("/");
  await page.getByTestId("name-input").fill(name);

  if (randomBeforeStart) {
    await setRandomSequence(page, randomBeforeStart);
  }

  if (mode === "player-vs-cpu") {
    await page.getByRole("radio", { name: "Player vs CPU" }).check();
  }

  await page.getByTestId("start-game").click();
};

const onlineIso = "2026-04-27T00:00:00.000Z";

const makeOnlineSummary = (
  id: string,
  state: "waiting_for_players" | "active",
  overrides?: Record<string, unknown>,
) => ({
  id,
  state,
  currentTurn: state === "active" ? "X" : null,
  players: {
    X: { mark: "X", displayName: "Alice", joinedAt: onlineIso },
    ...(state === "active" ? { O: { mark: "O", displayName: "Bob", joinedAt: onlineIso } } : {}),
  },
  moveCount: state === "active" ? 2 : 0,
  createdAt: onlineIso,
  updatedAt: onlineIso,
  startedAt: state === "active" ? onlineIso : null,
  latestSequence: state === "active" ? 4 : 1,
  ...overrides,
});

const makeOnlineGame = (
  id: string,
  state: "waiting_for_players" | "active",
  overrides?: Record<string, unknown>,
) => ({
  ...makeOnlineSummary(id, state),
  board: Array(9).fill(null),
  winner: null,
  moveHistory: [],
  endedAt: null,
  lastMoveAt: null,
  abandonmentDeadlineAt: state === "active" ? "2026-04-27T00:03:00.000Z" : null,
  eventHistory: [],
  ...overrides,
});

const installOnlineLobbyMocks = async (page: import("@playwright/test").Page) => {
  const joinedWaitingGame = makeOnlineGame("game_waiting", "active", {
    currentTurn: "O",
    players: {
      X: { mark: "X", displayName: "Alice", joinedAt: onlineIso },
      O: { mark: "O", displayName: "Bob", joinedAt: onlineIso },
    },
    startedAt: onlineIso,
    latestSequence: 2,
  });
  const activeGame = makeOnlineGame("game_active", "active");

  await page.addInitScript(() => {
    const runtimeWindow = window as typeof window & {
      __TICTACTOE_API_HTTP_URL__?: string;
      __TICTACTOE_API_WS_URL__?: string;
    };
    runtimeWindow.__TICTACTOE_API_HTTP_URL__ = "http://api.test";
    runtimeWindow.__TICTACTOE_API_WS_URL__ = "ws://api.test/ws";

    class FakeWebSocket {
      listeners = new Map<string, Array<(event: { data?: string }) => void>>();

      constructor() {
        window.setTimeout(() => this.emit("open", {}), 0);
      }

      addEventListener(type: string, listener: (event: { data?: string }) => void) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }

      send(data: string) {
        const subscription = JSON.parse(data) as {
          gameId: string;
          role: "player" | "spectator";
        };
        window.setTimeout(() => {
          this.emit("message", {
            data: JSON.stringify({
              type: "subscription.confirmed",
              gameId: subscription.gameId,
              role: subscription.role,
              playerMark: subscription.role === "player" ? "O" : undefined,
              latestSequence: 2,
            }),
          });
        }, 0);
      }

      close() {
        this.emit("close", {});
      }

      emit(type: string, event: { data?: string }) {
        for (const listener of this.listeners.get(type) ?? []) {
          listener(event);
        }
      }
    }

    window.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  await page.route("http://api.test/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === "/api/games" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          games: [
            makeOnlineSummary("game_waiting", "waiting_for_players"),
            makeOnlineSummary("game_active", "active"),
          ],
        }),
      });
      return;
    }

    if (url.pathname === "/api/games/game_waiting/join" && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          game: joinedWaitingGame,
          player: { mark: "O", displayName: "Bob", playerToken: "token_o" },
        }),
      });
      return;
    }

    if (url.pathname === "/api/games/game_waiting" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ game: joinedWaitingGame }),
      });
      return;
    }

    if (url.pathname === "/api/games/game_active" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ game: activeGame }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found." } }),
    });
  });
};

test("renders the landing page and starts a game after valid setup", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Tic-Tac-Toe Lab" })).toBeVisible();
  await expect(page.getByTestId("landing-heading")).toHaveText("Start a new game");
  await expect(page.getByTestId("name-counter")).toHaveText("0/24");

  await page.getByTestId("name-input").fill("Alex99");
  await page.getByTestId("start-game").click();

  await expect(page.getByTestId("player-name")).toHaveText("Alex99");
  await expect(page.getByTestId("matchup-label")).toHaveText("Alex99 vs Alex99");
  await expect(page.getByTestId("game-state")).toHaveText("active");
  await expect(page.getByTestId("game-mode")).toHaveText("player-vs-player");
  await expect(page.getByTestId("move-count")).toHaveText("0");
  await expect(page.getByTestId("player-role")).toHaveText("Two local players share the board.");
  await expect(page.getByTestId("empty-history")).toHaveText("No moves recorded yet.");
  await expect(page.getByRole("grid", { name: "Tic-tac-toe board" })).toBeVisible();
});

test("switches to CPU mode and responds immediately after a human move", async ({ page }) => {
  await startGame(page, { mode: "player-vs-cpu", randomBeforeStart: [0.1, 0.1] });

  await expect(page.getByTestId("matchup-label")).toHaveText("Alex99 vs CPU");
  await expect(page.getByTestId("game-mode")).toHaveText("player-vs-cpu");
  await expect(page.getByTestId("player-role")).toContainText("You are playing as X");
  await expect(page.getByTestId("current-player")).toHaveText("X");
  await expect(page.getByTestId("current-controller")).toHaveText("human");

  await page.getByTestId("cell-0").click();

  await expect(page.getByTestId("cell-0")).toHaveText("X");
  await expect(page.getByTestId("cell-4")).toHaveText("O");
  await expect(page.getByTestId("move-count")).toHaveText("2");
  await expect(page.getByTestId("current-player")).toHaveText("X");
  await expect(page.getByTestId("current-controller")).toHaveText("human");
});

test("shows which board cells are playable, occupied, and locked", async ({ page }) => {
  await startGame(page);

  await expect(page.getByTestId("cell-0")).toHaveAttribute("data-cell-state", "playable");
  await page.getByTestId("cell-0").click();
  await expect(page.getByTestId("cell-0")).toHaveAttribute("data-cell-state", "occupied");
  await expect(page.getByTestId("cell-1")).toHaveAttribute("data-cell-state", "playable");
});

test("starts with a CPU opening move when the CPU is the randomized starter", async ({ page }) => {
  await startGame(page, { mode: "player-vs-cpu", randomBeforeStart: [0.8, 0.1, 0.0] });

  await expect(page.getByTestId("player-role")).toContainText("You are playing as X");
  await expect(page.getByTestId("cell-4")).toHaveText("O");
  await expect(page.getByTestId("cell-4")).toHaveAttribute("data-cell-state", "occupied");
  await expect(page.getByTestId("move-count")).toHaveText("1");
  await expect(page.getByTestId("current-player")).toHaveText("X");
  await expect(page.getByTestId("current-controller")).toHaveText("human");
});

test("resets immediately when switching modes mid-game", async ({ page }) => {
  await startGame(page);

  await page.getByTestId("cell-0").click();
  await setRandomSequence(page, [0.1, 0.1]);
  await page.getByTestId("mode-select").selectOption("player-vs-cpu");

  await expect(page.getByTestId("game-mode")).toHaveText("player-vs-cpu");
  await expect(page.getByTestId("move-count")).toHaveText("0");
  await expect(page.getByTestId("cell-0")).toHaveText("");
});

test("shows a You lose banner when the CPU wins", async ({ page }) => {
  await startGame(page, { mode: "player-vs-cpu", randomBeforeStart: [0.1, 0.1] });
  await page.getByTestId("cell-0").click();
  await page.getByTestId("cell-1").click();
  await page.getByTestId("cell-8").click();

  await expect(page.getByTestId("result-banner")).toHaveText("You lose");
  await expect(page.getByTestId("loss-feedback")).toHaveText("Try again. The CPU took this round.");
  await expect(page.getByTestId("rematch-button")).toBeVisible();
  await expect(page.getByTestId("winner")).toHaveText("O");
  await expect(page.getByTestId("game-state")).toHaveText("won");
});

test("shows PvP terminal copy for a local winner", async ({ page }) => {
  await mockRandomSequenceOnLoad(page, [0.1]);
  await startGame(page);

  const startingPlayer = await page.getByTestId("current-player").textContent();
  const winningSequence =
    startingPlayer === "X" ? [0, 3, 1, 4, 2] : [3, 0, 4, 1, 5];

  for (const index of winningSequence) {
    await page.getByTestId(`cell-${index}`).click();
  }

  await expect(page.getByTestId("result-banner")).toHaveText(`${startingPlayer} wins`);
  await expect(page.getByTestId("confetti")).toBeVisible();
  const viewport = page.viewportSize();
  const confettiBounds = await page.getByTestId("confetti").boundingBox();
  expect(viewport).toBeTruthy();
  expect(confettiBounds).toBeTruthy();
  expect(confettiBounds?.width).toBeGreaterThanOrEqual((viewport?.width ?? 0) - 4);
  expect(confettiBounds?.height).toBeGreaterThanOrEqual((viewport?.height ?? 0) - 4);

  const firstPiece = page.locator(".confetti-piece").first();
  const startBounds = await firstPiece.boundingBox();
  await page.waitForTimeout(700);
  const movedBounds = await firstPiece.boundingBox();

  expect(startBounds).toBeTruthy();
  expect(movedBounds).toBeTruthy();
  expect((movedBounds?.y ?? 0) - (startBounds?.y ?? 0)).toBeGreaterThan(90);
  await expect(page.getByTestId("winner")).toHaveText(startingPlayer ?? "");
  await expect(page.getByTestId("game-state")).toHaveText("won");
});

test("shows a draw banner when the board fills without a winner", async ({ page }) => {
  await mockRandomSequenceOnLoad(page, [0.1]);
  await startGame(page);

  for (const index of [0, 4, 8, 2, 6, 3, 5, 7, 1]) {
    await page.getByTestId(`cell-${index}`).click();
  }

  await expect(page.getByTestId("result-banner")).toHaveText("Draw");
  await expect(page.getByTestId("game-state")).toHaveText("draw");
  await expect(page.getByTestId("winner")).toHaveText("None");
});

test("renders X and O with different high-contrast colors", async ({ page }) => {
  await mockRandomSequenceOnLoad(page, [0.1]);
  await startGame(page);

  await page.getByTestId("cell-0").click();
  await page.getByTestId("cell-1").click();

  const firstMark = await page.getByTestId("cell-0").getAttribute("data-mark");
  const secondMark = await page.getByTestId("cell-1").getAttribute("data-mark");

  expect(firstMark).toBeTruthy();
  expect(secondMark).toBeTruthy();
  expect(firstMark).not.toBe("empty");
  expect(secondMark).not.toBe("empty");
  expect(firstMark).not.toBe(secondMark);

  const firstColor = await page
    .getByTestId("cell-0")
    .evaluate((element) => getComputedStyle(element).color);
  const secondColor = await page
    .getByTestId("cell-1")
    .evaluate((element) => getComputedStyle(element).color);

  expect(firstColor).not.toBe(secondColor);
});

test("rejects an empty or invalid player name on the landing page", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("name-error")).toHaveText("Enter your name to start a game.");

  await page.getByTestId("name-input").fill("Alex 99");
  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("name-error")).toHaveText(
    "Use letters, numbers, underscores, or hyphens only.",
  );
  await expect(page.getByTestId("landing-heading")).toHaveText("Start a new game");
});

test("accepts underscores and hyphens in player names", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("name-input").fill("Alex-99_ok");
  await page.getByTestId("start-game").click();

  await expect(page.getByTestId("player-name")).toHaveText("Alex-99_ok");
});

test("shows a visible configuration error when online API env vars are missing", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "Online Multiplayer" }).check();
  await page.getByTestId("name-input").fill("OnlineUser");
  await page.getByTestId("start-game").click();

  await expect(page.getByTestId("online-error")).toContainText(
    "Online multiplayer is not configured.",
  );
  await expect(page.getByTestId("landing-heading")).toHaveText("Start a new game");
});

test("joins a selected waiting online game from the in-progress list", async ({ page }) => {
  await installOnlineLobbyMocks(page);
  await page.goto("/");

  await page.getByRole("radio", { name: "Online Multiplayer" }).check();
  await page.getByTestId("online-action-join").click();

  await expect(page.getByTestId("online-game-option-game_waiting")).toContainText("Waiting");
  await expect(page.getByTestId("online-game-option-game_active")).toBeDisabled();

  await page.getByTestId("online-game-option-game_waiting").click();
  await expect(page.getByTestId("game-id-input")).toHaveValue("game_waiting");

  await page.getByTestId("name-input").fill("Bob");
  await page.getByTestId("start-game").click();

  await expect(page.getByTestId("online-game-id")).toHaveText("game_waiting");
  await expect(page.getByTestId("online-role")).toHaveText("Player O");
});

test("spectates a selected active online game from the in-progress list", async ({ page }) => {
  await installOnlineLobbyMocks(page);
  await page.goto("/");

  await page.getByRole("radio", { name: "Online Multiplayer" }).check();
  await page.getByTestId("online-action-spectate").click();
  await page.getByTestId("online-game-option-game_active").click();
  await expect(page.getByTestId("game-id-input")).toHaveValue("game_active");

  await page.getByTestId("name-input").fill("Spec_1");
  await page.getByTestId("start-game").click();

  await expect(page.getByTestId("online-game-id")).toHaveText("game_active");
  await expect(page.getByTestId("online-role")).toHaveText("Spectator");
});

test("prevents illegal moves in the UI after a cell is occupied", async ({ page }) => {
  await startGame(page);

  await page.getByTestId("cell-0").click();
  await expect(page.getByTestId("cell-0")).toHaveAttribute("data-cell-state", "occupied");
  await expect(page.getByTestId("cell-0")).toHaveAttribute("aria-disabled", "true");

  const firstMark = await page.getByTestId("cell-0").textContent();
  const nextPlayer = firstMark === "X" ? "O" : "X";

  await expect(page.getByTestId("move-count")).toHaveText("1");
  await expect(page.getByTestId("current-player")).toHaveText(nextPlayer);
});

test("lets the player quit back to the landing page", async ({ page }) => {
  await startGame(page);

  await page.getByRole("button", { name: "Quit game" }).click();

  await expect(page.getByTestId("landing-heading")).toHaveText("Start a new game");
  await expect(page.getByTestId("name-input")).toHaveValue("");
});

test("offers a rematch after a finished CPU game", async ({ page }) => {
  await startGame(page, { mode: "player-vs-cpu", randomBeforeStart: [0.1, 0.1] });

  await page.getByTestId("cell-0").click();
  await page.getByTestId("cell-1").click();
  await page.getByTestId("cell-8").click();
  await setRandomSequence(page, [0.1, 0.1]);
  await page.getByTestId("rematch-button").click();

  await expect(page.getByTestId("game-state")).toHaveText("active");
  await expect(page.getByTestId("game-mode")).toHaveText("player-vs-cpu");
  await expect(page.getByTestId("move-count")).toHaveText("0");
});

test("limits player names to 24 characters", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("name-input").fill("ABCDEFGHIJKLMNOPQRSTUVWXYZ");

  await expect(page.getByTestId("name-input")).toHaveValue("ABCDEFGHIJKLMNOPQRSTUVWX");
  await expect(page.getByTestId("name-counter")).toHaveText("24/24");
});
