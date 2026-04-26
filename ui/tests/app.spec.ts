import { expect, test } from "@playwright/test";

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

  await page.getByTestId("name-input").fill("Alex-99");
  await page.getByTestId("start-game").click();
  await expect(page.getByTestId("name-error")).toHaveText("Use letters and numbers only.");
  await expect(page.getByTestId("landing-heading")).toHaveText("Start a new game");
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
