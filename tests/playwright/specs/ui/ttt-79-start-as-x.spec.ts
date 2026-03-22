import { expect, test, type Locator, type Page } from "@playwright/test";

async function firstVisibleLocator(candidates: Locator[]) {
  for (const candidate of candidates) {
    if ((await candidate.count()) > 0) {
      return candidate.first();
    }
  }

  return candidates[0].first();
}

async function boardLocator(page: Page) {
  const mainButtons = page
    .locator("main button")
    .filter({ hasNotText: /quit to landing|rematch|sound/i });

  if ((await mainButtons.count()) === 9) {
    return mainButtons.first().locator('xpath=ancestor::div[contains(@class, "grid")][1]');
  }

  return firstVisibleLocator([
    page.getByRole("grid", { name: /tic[- ]?tac[- ]?toe board|game board|board/i }),
    page.getByTestId("game-board"),
  ]);
}

async function statusLocator(page: Page) {
  return firstVisibleLocator([
    page.getByRole("status"),
    page.getByTestId("game-status"),
    page.getByText(/round 1|your turn|cpu/i),
  ]);
}

async function playerMarkLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("player-mark"),
    page.getByText(/player mark/i),
  ]);
}

async function cpuMarkLocator(page: Page) {
  return firstVisibleLocator([
    page.getByTestId("cpu-mark"),
    page.getByText(/cpu mark/i),
  ]);
}

async function resolveOptionLocator(page: Page, label: "X" | "O" | "Random") {
  const exact =
    label === "X"
      ? /play as x/i
      : label === "O"
        ? /play as o/i
        : /random draw|random/i;

  const radio = page.getByRole("radio", { name: exact });
  if ((await radio.count()) > 0) {
    return radio.first();
  }

  const button = page.getByRole("button", { name: exact });
  if ((await button.count()) > 0) {
    return button.first();
  }

  throw new Error(`Could not find mark-selection control for ${label}`);
}

test.describe("TTT-79 start game as X", () => {
  test("Selecting X and starting the game shows the board instead of leaving the landing screen visible", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");

    await (await resolveOptionLocator(page, "X")).click();
    await page.getByRole("button", { name: /play vs cpu/i }).click();

    await expect(page.getByRole("button", { name: /play vs cpu/i })).toHaveCount(0);
    await expect(await boardLocator(page)).toBeVisible();
    await expect((await boardLocator(page)).getByRole("button")).toHaveCount(9);
    await expect(await playerMarkLocator(page)).toContainText(/x/i);
    await expect(await cpuMarkLocator(page)).toContainText(/o/i);
    await expect(await statusLocator(page)).toContainText(/your turn|round 1/i);
    expect(errors).toHaveLength(0);
  });
});
