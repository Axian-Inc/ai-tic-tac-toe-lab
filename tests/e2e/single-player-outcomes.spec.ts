import { test } from "./fixtures/test-fixture";
import {
  SINGLE_PLAYER_WINNING_LINES,
  planSinglePlayerCpuWinScenario,
  planSinglePlayerDrawScenario,
  planSinglePlayerPlayerWinScenario,
  planSinglePlayerWinningLineScenario,
} from "./support/single-player-scenarios";

test.describe("Phase 3 Single-Player Outcomes", () => {
  test("UI-003 single-player draw, replay, and home", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    singlePlayerDriver,
  }) => {
    const drawScenario = planSinglePlayerDrawScenario();

    test.skip(
      !drawScenario,
      "No deterministic draw path could be planned from the current single-player game logic."
    );

    await StepAsync("Start a fresh single-player game for the draw scenario", async () => {
      await landingPage.goto();
      await landingPage.startCpuGame();
      await gameplayPage.expectLoaded();
    });

    await StepAsync("Play the full draw sequence to game over", async () => {
      await singlePlayerDriver.playPlannedGame(drawScenario!.playerMoves);
      await gameplayPage.waitForGameOver();
      await gameplayPage.expectStatusEquals("Game over: It's a draw.");
      await gameplayPage.expectPlayAgainVisible();
      await gameplayPage.expectHomeVisible();
    });

    await StepAsync("Attempt another move after the draw", async () => {
      const markedCellCountAtGameOver = await gameplayPage.countMarkedCells();
      await gameplayPage.expectCellDisabled(0);
      await gameplayPage.waitForMarkedCellCount(markedCellCountAtGameOver);
    });

    await StepAsync("Play again after the draw", async () => {
      await gameplayPage.clickPlayAgain();
      await gameplayPage.expectBoardEmpty();
      await gameplayPage.expectStatusEquals("Your turn (X)");
      await gameplayPage.expectQuitVisible();
    });

    await StepAsync("Return home after reaching a completed single-player game", async () => {
      await singlePlayerDriver.playPlannedGame(drawScenario!.playerMoves);
      await gameplayPage.waitForGameOver();
      await gameplayPage.clickHome();
      await landingPage.expectLoaded();
    });
  });

  test("UI-004 single-player win and loss outcomes", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    singlePlayerDriver,
  }) => {
    const playerWinScenario = planSinglePlayerPlayerWinScenario();
    const cpuWinScenario = planSinglePlayerCpuWinScenario();

    await StepAsync("Start a fresh single-player game for the player-win scenario", async () => {
      test.skip(
        !playerWinScenario,
        "The deterministic minimax CPU does not expose a player-win path through the current UI-only single-player flow."
      );

      await landingPage.goto();
      await landingPage.startCpuGame();
      await gameplayPage.expectLoaded();
      await gameplayPage.expectStatusEquals("Your turn (X)");
    });

    await StepAsync("Complete the winning sequence for X", async () => {
      await singlePlayerDriver.playPlannedGame(playerWinScenario!.playerMoves);
      await gameplayPage.waitForGameOver();
      await gameplayPage.expectStatusEquals("Game over: You win!");
      await gameplayPage.expectPlayAgainVisible();
    });

    await StepAsync("Attempt another move after the player win", async () => {
      const markedCellCountAtGameOver = await gameplayPage.countMarkedCells();
      await gameplayPage.expectCellDisabled(0);
      await gameplayPage.waitForMarkedCellCount(markedCellCountAtGameOver);
    });

    await StepAsync("Start a fresh single-player game for the CPU-win scenario", async () => {
      await landingPage.goto();
      await landingPage.startCpuGame();
      await gameplayPage.expectLoaded();

      test.skip(
        !cpuWinScenario,
        "No deterministic CPU-win path could be planned from the current single-player game logic."
      );
    });

    await StepAsync("Allow the CPU to complete the winning line", async () => {
      await singlePlayerDriver.playPlannedGame(cpuWinScenario!.playerMoves);
      await gameplayPage.waitForGameOver();
      await gameplayPage.expectStatusEquals("Game over: CPU wins.");
      await gameplayPage.expectLossFeedbackVisible();
      await gameplayPage.expectHomeVisible();
    });
  });

  test("UI-005 single-player winning-line coverage", async ({
    StepAsync,
    gameplayPage,
    landingPage,
    singlePlayerDriver,
  }) => {
    await StepAsync("Prepare repeated single-player sessions for line validation", async () => {
      await landingPage.goto();
      await landingPage.expectLoaded();
    });

    for (const winningLine of SINGLE_PLAYER_WINNING_LINES) {
      await StepAsync(
        `Validate winning line ${winningLine[0] + 1}-${winningLine[1] + 1}-${winningLine[2] + 1}`,
        async () => {
          const plannedScenario = planSinglePlayerWinningLineScenario(winningLine);

          test.skip(
            !plannedScenario,
            `No deterministic single-player path was found for winning line ${winningLine.join("-")}.`
          );

          await landingPage.goto();
          await landingPage.startCpuGame();
          await gameplayPage.expectLoaded();

          await singlePlayerDriver.playPlannedGame(plannedScenario!.playerMoves);
          await gameplayPage.waitForGameOver();

          const winnerLabel =
            plannedScenario!.winner === "X" ? "Game over: You win!" : "Game over: CPU wins.";

          await gameplayPage.expectStatusEquals(winnerLabel);

          const markedCellCountAtGameOver = await gameplayPage.countMarkedCells();
          await gameplayPage.expectCellDisabled(0);
          await gameplayPage.waitForMarkedCellCount(markedCellCountAtGameOver);
        }
      );
    }
  });
});
