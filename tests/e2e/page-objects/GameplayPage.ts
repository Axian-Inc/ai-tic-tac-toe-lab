import { expect, type Locator, type Page } from "@playwright/test";
import type { BoardCell } from "../../../src/shared/game";

export class GameplayPage {
  readonly page: Page;
  readonly root: Locator;
  readonly status: Locator;
  readonly board: Locator;
  readonly playAgainButton: Locator;
  readonly lossFeedbackText: Locator;
  readonly multiplayerSessionCard: Locator;
  readonly matchIdText: Locator;
  readonly refreshMatchButton: Locator;
  readonly multiplayerSessionRole: Locator;
  readonly multiplayerGameStatus: Locator;
  readonly liveSyncStatus: Locator;
  readonly gameplayErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("gameplay-page");
    this.status = page.getByTestId("game-status");
    this.board = page.getByTestId("game-board");
    this.playAgainButton = page.getByTestId("play-again-button");
    this.lossFeedbackText = page.getByTestId("loss-feedback-text");
    this.multiplayerSessionCard = page.getByTestId("multiplayer-session-card");
    this.matchIdText = page.getByTestId("match-id-text");
    this.refreshMatchButton = page.getByTestId("refresh-match-button");
    this.multiplayerSessionRole = page.getByTestId("multiplayer-session-role");
    this.multiplayerGameStatus = page.getByTestId("multiplayer-game-status");
    this.liveSyncStatus = page.getByTestId("live-sync-status");
    this.gameplayErrorMessage = page.getByTestId("gameplay-error-message");
  }

  cell(position: number): Locator {
    return this.page.getByTestId(`board-cell-${position}`);
  }

  boardCells(): Locator {
    return this.page.locator('[data-testid^="board-cell-"]');
  }

  quitButton(): Locator {
    return this.page.getByRole("button", { name: "Quit" });
  }

  homeButton(): Locator {
    return this.page.getByRole("button", { name: "Home" });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/game/);
    await expect(this.root).toBeVisible();
    await expect(this.status).toBeVisible();
    await expect(this.board).toBeVisible();
  }

  async expectBoardCellCount(count: number): Promise<void> {
    await expect(this.boardCells()).toHaveCount(count);
  }

  async expectStatusContains(text: string): Promise<void> {
    await expect(this.status).toContainText(text);
  }

  async expectStatusEquals(text: string): Promise<void> {
    await expect(this.status).toHaveText(text);
  }

  async playCell(position: number): Promise<void> {
    await this.cell(position).click();
  }

  async expectCellValue(position: number, value: string): Promise<void> {
    await expect(this.cell(position)).toContainText(value);
  }

  async expectCellEmpty(position: number): Promise<void> {
    await expect(this.cell(position)).toHaveText("");
  }

  async expectCellEnabled(position: number): Promise<void> {
    await expect(this.cell(position)).toBeEnabled();
  }

  async expectCellDisabled(position: number): Promise<void> {
    await expect(this.cell(position)).toBeDisabled();
  }

  async expectBoardEmpty(): Promise<void> {
    for (let position = 0; position < 9; position += 1) {
      await this.expectCellEmpty(position);
    }
  }

  async getBoardValues(): Promise<BoardCell[]> {
    const values = await this.boardCells().evaluateAll((cells) =>
      cells.map((cell) => {
        const text = cell.textContent?.trim() ?? "";
        return text === "X" || text === "O" ? text : null;
      })
    );

    return values as BoardCell[];
  }

  async countMarkedCells(): Promise<number> {
    const values = await this.getBoardValues();
    return values.filter((value) => value !== null).length;
  }

  async waitForMarkedCellCount(count: number): Promise<void> {
    await expect
      .poll(async () => this.countMarkedCells(), {
        message: `expected ${count} marked cells on the board`,
      })
      .toBe(count);
  }

  async waitForGameOver(): Promise<void> {
    await expect
      .poll(async () => this.isGameOver(), {
        message: "expected the game to reach a terminal state",
      })
      .toBe(true);
  }

  async isGameOver(): Promise<boolean> {
    const statusText = await this.status.textContent();
    return statusText?.startsWith("Game over:") ?? false;
  }

  async clickPlayAgain(): Promise<void> {
    await this.playAgainButton.click();
  }

  async clickQuit(): Promise<void> {
    await this.quitButton().click();
  }

  async clickHome(): Promise<void> {
    await this.homeButton().click();
  }

  async expectQuitVisible(): Promise<void> {
    await expect(this.quitButton()).toBeVisible();
  }

  async expectHomeVisible(): Promise<void> {
    await expect(this.homeButton()).toBeVisible();
  }

  async expectPlayAgainVisible(): Promise<void> {
    await expect(this.playAgainButton).toBeVisible();
  }

  async expectLossFeedbackVisible(): Promise<void> {
    await expect(this.lossFeedbackText).toBeVisible();
  }

  async expectMultiplayerSessionVisible(): Promise<void> {
    await expect(this.multiplayerSessionCard).toBeVisible();
  }

  async expectMatchIdText(value: string): Promise<void> {
    await expect(this.matchIdText).toHaveText(value);
  }

  async clickRefreshMatch(): Promise<void> {
    await this.refreshMatchButton.click();
  }

  async expectRefreshMatchVisible(): Promise<void> {
    await expect(this.refreshMatchButton).toBeVisible();
  }

  async expectMultiplayerRoleText(text: string): Promise<void> {
    await expect(this.multiplayerSessionRole).toHaveText(text);
  }

  async expectMultiplayerStatusContains(text: string): Promise<void> {
    await expect(this.multiplayerGameStatus).toContainText(text);
  }

  async expectLiveSyncContains(text: string): Promise<void> {
    await expect(this.liveSyncStatus).toContainText(text);
  }

  async expectGameplayErrorContains(text: string): Promise<void> {
    await expect(this.gameplayErrorMessage).toContainText(text);
  }

  async expectBoardReadOnly(): Promise<void> {
    for (let position = 0; position < 9; position += 1) {
      await this.expectCellDisabled(position);
    }
  }
}
