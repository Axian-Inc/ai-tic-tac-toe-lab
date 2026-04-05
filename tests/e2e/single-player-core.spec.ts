import { expect, test } from "./fixtures/test-fixture";

test.describe("Phase 3 Single-Player Core", () => {
  test("UI-001 landing to single-player start", async ({
    StepAsync,
    gameplayPage,
    landingPage,
  }) => {
    await StepAsync("Open the app at the landing page", async () => {
      await landingPage.goto();
      await landingPage.expectLoaded();
    });

    await StepAsync("Start a single-player game from the landing page", async () => {
      await landingPage.startCpuGame();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectBoardCellCount(9);
    });

    await StepAsync("Observe the fresh gameplay board", async () => {
      await gameplayPage.expectBoardEmpty();
      await gameplayPage.expectStatusEquals("Your turn (X)");
      await gameplayPage.expectQuitVisible();
    });
  });

  test("UI-002 single-player move validation and quit", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    singlePlayerDriver,
  }) => {
    await StepAsync("Start a new single-player game", async () => {
      await landingPage.goto();
      await landingPage.startCpuGame();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectBoardEmpty();
      await gameplayPage.expectQuitVisible();
    });

    await StepAsync("Click one empty cell and wait for the CPU response", async () => {
      await singlePlayerDriver.playMoveAndWaitForCpu(0);
      await gameplayPage.expectCellValue(0, "X");
      await gameplayPage.expectStatusEquals("Your turn (X)");
    });

    await StepAsync("Attempt to click the same occupied cell again", async () => {
      const markedCellCountBeforeRetry = await gameplayPage.countMarkedCells();
      await gameplayPage.expectCellDisabled(0);
      await gameplayPage.waitForMarkedCellCount(markedCellCountBeforeRetry);
      await gameplayPage.expectCellValue(0, "X");
    });

    await StepAsync("Verify only one player move is accepted per move cycle", async () => {
      const boardBeforeSecondMove = await gameplayPage.getBoardValues();
      const xCountBeforeSecondMove = boardBeforeSecondMove.filter(
        (value) => value === "X"
      ).length;
      const oCountBeforeSecondMove = boardBeforeSecondMove.filter(
        (value) => value === "O"
      ).length;

      await singlePlayerDriver.playMoveAndWaitForCpu(2);

      const boardAfterSecondMove = await gameplayPage.getBoardValues();
      const xCountAfterSecondMove = boardAfterSecondMove.filter(
        (value) => value === "X"
      ).length;
      const oCountAfterSecondMove = boardAfterSecondMove.filter(
        (value) => value === "O"
      ).length;

      await gameplayPage.expectCellValue(2, "X");
      expect(xCountAfterSecondMove).toBe(xCountBeforeSecondMove + 1);
      expect(oCountAfterSecondMove).toBe(oCountBeforeSecondMove + 1);
      await gameplayPage.expectStatusEquals("Your turn (X)");
    });

    await StepAsync("Quit back to the landing page", async () => {
      await gameplayPage.clickQuit();
      await landingPage.expectLoaded();
    });
  });
});
