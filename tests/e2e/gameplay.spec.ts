import { test } from "./fixtures/test-fixture";

test("UI-001 player can start a game and place the opening move", async ({
  StepAsync,
  gameplayPage,
  landingPage,
}) => {
  await StepAsync("Open the landing page", async () => {
    await landingPage.goto();
    await landingPage.expectLoaded();
  });

  await StepAsync("Start a single-player game", async () => {
    await landingPage.startCpuGame();
    await gameplayPage.expectLoaded();
    await gameplayPage.expectStatusContains("Your turn");
    await gameplayPage.expectBoardCellCount(9);
  });

  await StepAsync("Place the opening move and verify the CPU response", async () => {
    await gameplayPage.playCell(0);
    await gameplayPage.expectCellValue(0, "X");
    await gameplayPage.expectCellValue(4, "O");
  });
});
