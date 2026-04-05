import { GameplayPage } from "../page-objects/GameplayPage";

export class SinglePlayerDriver {
  readonly gameplayPage: GameplayPage;

  constructor(gameplayPage: GameplayPage) {
    this.gameplayPage = gameplayPage;
  }

  async playMoveAndWaitForCpu(position: number): Promise<void> {
    const markedCellCountBeforeMove = await this.gameplayPage.countMarkedCells();

    await this.gameplayPage.playCell(position);
    await this.gameplayPage.expectCellValue(position, "X");

    const targetMarkedCount = Math.min(markedCellCountBeforeMove + 2, 9);

    await this.gameplayPage.waitForMarkedCellCount(targetMarkedCount);
  }

  async playPlannedGame(playerMoves: number[]): Promise<void> {
    for (const position of playerMoves) {
      if (await this.gameplayPage.isGameOver()) {
        return;
      }

      await this.playMoveAndWaitForCpu(position);
    }
  }
}
