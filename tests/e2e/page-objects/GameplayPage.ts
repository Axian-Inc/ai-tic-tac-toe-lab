import { expect, type Locator, type Page } from "@playwright/test";

export class GameplayPage {
  readonly page: Page;
  readonly root: Locator;
  readonly status: Locator;
  readonly board: Locator;
  readonly playAgainButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("gameplay-page");
    this.status = page.getByTestId("game-status");
    this.board = page.getByTestId("game-board");
    this.playAgainButton = page.getByTestId("play-again-button");
  }

  cell(position: number): Locator {
    return this.page.getByTestId(`board-cell-${position}`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/game/);
    await expect(this.root).toBeVisible();
    await expect(this.status).toBeVisible();
    await expect(this.board).toBeVisible();
  }

  async expectBoardCellCount(count: number): Promise<void> {
    await expect(this.page.locator('[data-testid^="board-cell-"]')).toHaveCount(count);
  }

  async expectStatusContains(text: string): Promise<void> {
    await expect(this.status).toContainText(text);
  }

  async playCell(position: number): Promise<void> {
    await this.cell(position).click();
  }

  async expectCellValue(position: number, value: string): Promise<void> {
    await expect(this.cell(position)).toContainText(value);
  }
}
