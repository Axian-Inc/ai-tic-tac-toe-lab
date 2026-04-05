import { expect, test } from "./fixtures/test-fixture";

import type { MultiplayerGameSnapshot } from "../../src/shared/multiplayer";

function createSnapshot(
  overrides: Partial<MultiplayerGameSnapshot> = {}
): MultiplayerGameSnapshot {
  return {
    id: "game-1",
    name: "Lunch Match",
    status: "active",
    createdAt: "2026-03-30T12:00:00.000Z",
    updatedAt: "2026-03-30T12:05:00.000Z",
    hostName: "Host",
    openSeatCount: 0,
    players: {
      X: {
        player: "X",
        name: "Host",
        joinedAt: "2026-03-30T12:00:00.000Z",
      },
      O: {
        player: "O",
        name: "Guest",
        joinedAt: "2026-03-30T12:01:00.000Z",
      },
    },
    state: {
      board: [null, null, null, null, "X", null, null, "O", null],
      currentPlayer: "X",
      moves: [
        { order: 1, player: "X", position: 4 },
        { order: 2, player: "O", position: 7 },
      ],
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
          occurredAt: "2026-03-30T12:00:00.000Z",
          player: "X",
          sequence: 1,
        },
        {
          type: "player-joined",
          occurredAt: "2026-03-30T12:01:00.000Z",
          player: "O",
          sequence: 2,
        },
      ],
    },
    activity: {
      abandonmentDeadlineAt: "2026-03-30T12:08:00.000Z",
      abandonmentTimeoutMs: 180000,
      awaitingPlayer: "X",
      awaitingSince: "2026-03-30T12:05:00.000Z",
      lastProgressedAt: "2026-03-30T12:05:00.000Z",
    },
    ...overrides,
  };
}

test.describe("Spectate flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      class MockWebSocket {
        onclose = null;
        onerror = null;
        onmessage = null;
        onopen = null;
        url: string;

        constructor(url: string) {
          this.url = url;
          queueMicrotask(() => {
            this.onopen?.(new Event("open"));
          });
        }

        addEventListener() {}
        removeEventListener() {}
        close() {}
        send() {}
      }

      Object.defineProperty(window, "WebSocket", {
        configurable: true,
        writable: true,
        value: MockWebSocket,
      });
    });
  });

  test("renders a visible Spectate control on the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Spectate" }).first()).toBeVisible();
  });

  test("loads only active games for spectating and opens spectator gameplay", async ({
    page,
  }) => {
    let activeListRequestCount = 0;

    await page.route("http://localhost:3001/games?status=active", async (route) => {
      activeListRequestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          games: [
            {
              id: "game-1",
              name: "Lunch Match",
              status: "active",
              createdAt: "2026-03-30T12:00:00.000Z",
              updatedAt: "2026-03-30T12:05:00.000Z",
              hostName: "Host",
              openSeatCount: 0,
            },
          ],
        }),
      });
    });

    await page.route("http://localhost:3001/games/game-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          game: createSnapshot(),
        }),
      });
    });

    await page.goto("/");

    await page.getByRole("button", { name: "Spectate" }).first().click();

    await expect
      .poll(() => activeListRequestCount, {
        message: "expected the spectate panel to request active games",
      })
      .toBe(1);

    await expect(page.getByText("Spectate an active multiplayer game")).toBeVisible();
    await expect(page.getByText("Lunch Match")).toBeVisible();
    await expect(page.getByText("Join or spectate a multiplayer game")).toHaveCount(0);

    await page.locator(".multiplayer-game-card-active").getByRole("button", {
      name: "Spectate",
    }).click();

    await expect(page.getByTestId("gameplay-page")).toBeVisible();
    await expect(page.getByTestId("multiplayer-session-role")).toHaveText(
      "You are spectating"
    );
    await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resign" })).toHaveCount(0);
  });
});
