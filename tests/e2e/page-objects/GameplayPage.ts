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
  readonly multiplayerSessionHelp: Locator;
  readonly matchIdText: Locator;
  readonly refreshMatchButton: Locator;
  readonly multiplayerSessionRole: Locator;
  readonly multiplayerGameStatus: Locator;
  readonly liveSyncStatus: Locator;
  readonly abandonmentCountdown: Locator;
  readonly gameplayErrorMessage: Locator;
  readonly resignationButton: Locator;
  readonly timeoutButton: Locator;
  readonly resignConfirmationDialog: Locator;
  readonly resignConfirmButton: Locator;
  readonly resignCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("gameplay-page");
    this.status = page.getByTestId("game-status");
    this.board = page.getByTestId("game-board");
    this.playAgainButton = page.getByTestId("play-again-button");
    this.lossFeedbackText = page.getByTestId("loss-feedback-text");
    this.multiplayerSessionCard = page.getByTestId("multiplayer-session-card");
    this.multiplayerSessionHelp = page.locator(".gameplay-session-help").first();
    this.matchIdText = page.getByTestId("match-id-text");
    this.refreshMatchButton = page.getByTestId("refresh-match-button");
    this.multiplayerSessionRole = page.getByTestId("multiplayer-session-role");
    this.multiplayerGameStatus = page.getByTestId("multiplayer-game-status");
    this.liveSyncStatus = page.getByTestId("live-sync-status");
    this.abandonmentCountdown = page.getByTestId("abandonment-countdown");
    this.gameplayErrorMessage = page.getByTestId("gameplay-error-message");
    this.resignationButton = page.getByTestId("resignation-button");
    this.timeoutButton = page.getByTestId("timeout-button");
    this.resignConfirmationDialog = page.getByTestId("resign-confirmation-dialog");
    this.resignConfirmButton = page.getByTestId("resign-confirm-button");
    this.resignCancelButton = page.getByTestId("resign-cancel-button");
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

  async expectQuitHidden(): Promise<void> {
    await expect(this.quitButton()).toHaveCount(0);
  }

  async expectHomeVisible(): Promise<void> {
    await expect(this.homeButton()).toBeVisible();
  }

  async expectHomeHidden(): Promise<void> {
    await expect(this.homeButton()).toHaveCount(0);
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

  async expectMultiplayerSessionRole(role: "player" | "spectator"): Promise<void> {
    await expect(this.multiplayerSessionCard).toHaveAttribute("data-session-role", role);
  }

  async expectMultiplayerReplayMode(mode: "live" | "replay"): Promise<void> {
    await expect(this.multiplayerSessionCard).toHaveAttribute("data-replay-mode", mode);
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

  async expectMultiplayerRole(role: "player" | "spectator"): Promise<void> {
    await expect(this.multiplayerSessionRole).toHaveAttribute("data-role", role);
  }

  async expectMultiplayerStatusContains(text: string): Promise<void> {
    await expect(this.multiplayerGameStatus).toContainText(text);
  }

  async expectMultiplayerStatus(status: "waiting" | "active" | "over"): Promise<void> {
    await expect(this.multiplayerGameStatus).toHaveAttribute("data-status", status);
    await expect(this.multiplayerSessionCard).toHaveAttribute("data-game-status", status);
  }

  async expectLiveSyncContains(text: string): Promise<void> {
    await expect(this.liveSyncStatus).toContainText(text);
  }

  async expectLiveSyncState(
    state: "idle" | "connecting" | "connected" | "reconnecting" | "unavailable"
  ): Promise<void> {
    await expect(this.liveSyncStatus).toHaveAttribute("data-sync-state", state);
  }

  async expectSessionHelpContains(text: string): Promise<void> {
    await expect(this.multiplayerSessionHelp).toContainText(text);
  }

  async expectAbandonmentCountdownContains(text: string): Promise<void> {
    await expect(this.abandonmentCountdown).toContainText(text);
  }

  async expectAbandonmentAwaitingPlayer(player: "X" | "O"): Promise<void> {
    await expect(this.abandonmentCountdown).toHaveAttribute("data-awaiting-player", player);
  }

  async expectAbandonmentCountdownVisible(): Promise<void> {
    await expect(this.abandonmentCountdown).toBeVisible();
  }

  async expectAbandonmentCountdownHidden(): Promise<void> {
    await expect(this.abandonmentCountdown).toHaveCount(0);
  }

  async expectGameplayErrorContains(text: string): Promise<void> {
    await expect(this.gameplayErrorMessage).toContainText(text);
  }

  async expectGameplayErrorHidden(): Promise<void> {
    await expect(this.gameplayErrorMessage).toHaveCount(0);
  }

  async clickResign(): Promise<void> {
    await this.resignationButton.click();
  }

  async expectResignVisible(): Promise<void> {
    await expect(this.resignationButton).toBeVisible();
  }

  async expectResignHidden(): Promise<void> {
    await expect(this.resignationButton).toHaveCount(0);
  }

  async clickCheckTimeout(): Promise<void> {
    await this.timeoutButton.click();
  }

  async expectCheckTimeoutVisible(): Promise<void> {
    await expect(this.timeoutButton).toBeVisible();
  }

  async expectCheckTimeoutHidden(): Promise<void> {
    await expect(this.timeoutButton).toHaveCount(0);
  }

  async expectResignDialogVisible(): Promise<void> {
    await expect(this.resignConfirmationDialog).toBeVisible();
  }

  async expectResignDialogHidden(): Promise<void> {
    await expect(this.resignConfirmationDialog).toHaveCount(0);
  }

  async confirmResign(): Promise<void> {
    await this.resignConfirmButton.click();
  }

  async cancelResign(): Promise<void> {
    await this.resignCancelButton.click();
  }

  async expectBoardReadOnly(): Promise<void> {
    for (let position = 0; position < 9; position += 1) {
      await this.expectCellDisabled(position);
    }
  }

  async expectBoardInteractivePositions(positions: number[]): Promise<void> {
    const interactivePositions = new Set(positions);

    for (let position = 0; position < 9; position += 1) {
      if (interactivePositions.has(position)) {
        await this.expectCellEnabled(position);
      } else {
        await this.expectCellDisabled(position);
      }
    }
  }
}
