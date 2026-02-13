import { test, expect } from "@playwright/test";

test("spectate shows empty state when no active games", async ({ page }) => {
  await page.route("**/games?status=active", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ games: [] }),
    });
  });

  await page.goto("/spectate");
  await expect(page.getByTestId("spectate-list")).toContainText("No active games right now.");
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  await expect(page.getByTestId("spectate-detail")).toContainText(
    "Select a game to view details."
  );
});

test("spectate lists active games and links to watch", async ({ page }) => {
  let calls = 0;
  await page.route("**/games?status=active", async (route) => {
    calls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        games:
          calls === 1
            ? [
                {
                  id: "game-alpha",
                  status: "active",
                  createdAt: "2024-01-01T00:00:00.000Z",
                  updatedAt: "2024-01-02T02:30:00.000Z",
                  moveCount: 3,
                },
                {
                  id: "game-bravo",
                  status: "active",
                  createdAt: "2024-01-01T00:00:00.000Z",
                  updatedAt: "2024-01-03T12:15:00.000Z",
                  moveCount: 5,
                },
              ]
            : [
                {
                  id: "game-charlie",
                  status: "active",
                  createdAt: "2024-01-01T00:00:00.000Z",
                  updatedAt: "2024-01-04T06:45:00.000Z",
                  moveCount: 2,
                },
              ],
      }),
    });
  });

  await page.goto("/spectate");
  await expect(page.getByTestId("spectate-list")).toContainText("game-alpha");
  await expect(page.locator('time[data-game-id="game-alpha"]')).toHaveAttribute(
    "datetime",
    "2024-01-02T02:30:00.000Z"
  );
  await expect(
    page.locator(".spectate-item").first().getByRole("link", { name: "Watch" })
  ).toHaveAttribute("href", "/spectate/game-alpha");
  await expect(page.getByTestId("spectate-detail")).toContainText("game-alpha");
  await expect(page.getByRole("link", { name: "Watch game" })).toHaveAttribute(
    "href",
    "/spectate/game-alpha"
  );

  await page.getByRole("button", { name: /game-bravo/i }).click();
  await expect(page.getByTestId("spectate-detail")).toContainText("game-bravo");
  await expect(page.getByRole("link", { name: "Watch game" })).toHaveAttribute(
    "href",
    "/spectate/game-bravo"
  );

  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.getByTestId("spectate-list")).toContainText("game-charlie");
});
