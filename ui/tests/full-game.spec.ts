import { expect, test, type Page } from "./coverage";

type WinningLineScenario = {
  name: string;
  line: [number, number, number];
};

const BOARD_CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const WINNING_LINE_SCENARIOS: WinningLineScenario[] = [
  { name: "top row", line: [0, 1, 2] },
  { name: "middle row", line: [3, 4, 5] },
  { name: "bottom row", line: [6, 7, 8] },
  { name: "left column", line: [0, 3, 6] },
  { name: "middle column", line: [1, 4, 7] },
  { name: "right column", line: [2, 5, 8] },
  { name: "top-left diagonal", line: [0, 4, 8] },
  { name: "top-right diagonal", line: [2, 4, 6] },
];

const setRandomSequence = async (page: Page, values: number[]) => {
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

const startPlayerVsPlayerGame = async (page: Page) => {
  await page.goto("/");
  await page.getByTestId("name-input").fill("FullGame");
  await setRandomSequence(page, [0.1]);
  await page.getByTestId("start-game").click();

  await expect(page.getByTestId("game-mode")).toHaveText("player-vs-player");
  await expect(page.getByTestId("current-player")).toHaveText("X");
  await expect(page.getByTestId("current-controller")).toHaveText("human");
};

const buildWinningMoveSequence = (line: WinningLineScenario["line"]): number[] => {
  const opponentMoves = BOARD_CELLS.filter((cellIndex) => !line.includes(cellIndex));

  return [line[0], opponentMoves[0], line[1], opponentMoves[1], line[2]];
};

const playMoves = async (page: Page, moveSequence: number[]) => {
  for (const cellIndex of moveSequence) {
    await page.getByTestId(`cell-${cellIndex}`).click();
  }
};

test.describe("full game winning flows", () => {
  for (const scenario of WINNING_LINE_SCENARIOS) {
    test(`plays a complete game and detects the ${scenario.name} win`, async ({ page }) => {
      const moveSequence = buildWinningMoveSequence(scenario.line);

      await startPlayerVsPlayerGame(page);
      await playMoves(page, moveSequence);

      await expect(page.getByTestId("result-banner")).toHaveText("X wins");
      await expect(page.getByTestId("status-heading")).toHaveText("Winner: X");
      await expect(page.getByTestId("game-state")).toHaveText("won");
      await expect(page.getByTestId("winner")).toHaveText("X");
      await expect(page.getByTestId("move-count")).toHaveText("5");
      await expect(page.getByTestId("move-history").locator("li")).toHaveCount(5);

      for (const cellIndex of scenario.line) {
        await expect(page.getByTestId(`cell-${cellIndex}`)).toHaveText("X");
        await expect(page.getByTestId(`cell-${cellIndex}`)).toHaveAttribute(
          "data-cell-state",
          "occupied",
        );
      }

      for (const cellIndex of BOARD_CELLS) {
        await expect(page.getByTestId(`cell-${cellIndex}`)).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      }

      const lockedEmptyCell = BOARD_CELLS.find((cellIndex) => !moveSequence.includes(cellIndex));
      expect(lockedEmptyCell).toBeDefined();

      if (lockedEmptyCell !== undefined) {
        await page.getByTestId(`cell-${lockedEmptyCell}`).click({ force: true });
        await expect(page.getByTestId(`cell-${lockedEmptyCell}`)).toHaveText("");
        await expect(page.getByTestId("move-count")).toHaveText("5");
      }
    });
  }
});
