import { expect, type Locator, type Page } from "@playwright/test";

export class MultiplayerModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly backdrop: Locator;
  readonly closeButton: Locator;
  readonly createTab: Locator;
  readonly joinTab: Locator;
  readonly spectateTab: Locator;
  readonly refreshButton: Locator;
  readonly playerNameInput: Locator;
  readonly gameNameInput: Locator;
  readonly createSubmitButton: Locator;
  readonly createCancelButton: Locator;
  readonly errorMessage: Locator;
  readonly emptyStateMessage: Locator;
  readonly waitingGamesList: Locator;
  readonly activeGamesList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("multiplayer-modal-container");
    this.backdrop = page.getByTestId("multiplayer-modal-backdrop");
    this.closeButton = page.getByTestId("multiplayer-modal-close-button");
    this.createTab = page.getByTestId("create-tab-button");
    this.joinTab = page.getByTestId("join-tab-button");
    this.spectateTab = page.getByTestId("spectate-tab-button");
    this.refreshButton = page.getByTestId("discovery-refresh-button");
    this.playerNameInput = page.getByTestId("player-name-input");
    this.gameNameInput = page.getByTestId("game-name-input");
    this.createSubmitButton = page.getByTestId("create-submit-button");
    this.createCancelButton = page.getByTestId("create-cancel-button");
    this.errorMessage = page.getByTestId("modal-error-message");
    this.emptyStateMessage = page.getByTestId("empty-state-message");
    this.waitingGamesList = page.getByTestId("waiting-games-list");
    this.activeGamesList = page.getByTestId("active-games-list");
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog).toHaveCount(0);
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async closeByBackdrop(): Promise<void> {
    await this.backdrop.click({ position: { x: 5, y: 5 } });
  }

  async closeByEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  async switchToCreate(): Promise<void> {
    await this.createTab.click();
  }

  async switchToJoin(): Promise<void> {
    await this.joinTab.click();
  }

  async switchToSpectate(): Promise<void> {
    await this.spectateTab.click();
  }

  async expectPlayerNameVisible(): Promise<void> {
    await expect(this.playerNameInput).toBeVisible();
  }

  async expectPlayerNameHidden(): Promise<void> {
    await expect(this.playerNameInput).toHaveCount(0);
  }

  async fillPlayerName(value: string): Promise<void> {
    await this.playerNameInput.fill(value);
  }

  async fillGameName(value: string): Promise<void> {
    await this.gameNameInput.fill(value);
  }

  async submitCreate(): Promise<void> {
    await this.createSubmitButton.click();
  }

  async cancelCreate(): Promise<void> {
    await this.createCancelButton.click();
  }

  async expectCreateView(): Promise<void> {
    await this.expectOpen();
    await expect(this.gameNameInput).toBeVisible();
    await expect(this.createSubmitButton).toBeVisible();
  }

  async expectJoinView(): Promise<void> {
    await this.expectOpen();
    await expect(
      this.page.getByRole("heading", { name: "Join or spectate a multiplayer game" })
    ).toBeVisible();
  }

  async expectSpectateView(): Promise<void> {
    await this.expectOpen();
    await expect(
      this.page.getByRole("heading", { name: "Spectate an active multiplayer game" })
    ).toBeVisible();
  }

  async expectErrorContains(text: string): Promise<void> {
    await expect(this.errorMessage).toContainText(text);
  }

  async expectEmptyStateContains(text: string): Promise<void> {
    await expect(this.emptyStateMessage).toContainText(text);
  }

  async clickRefresh(): Promise<void> {
    await this.refreshButton.click();
  }

  waitingGameCard(gameId: string): Locator {
    return this.page.getByTestId(`waiting-game-card-${gameId}`);
  }

  activeGameCard(gameId: string): Locator {
    return this.page.getByTestId(`active-game-card-${gameId}`);
  }

  joinGameButton(gameId: string): Locator {
    return this.page.getByTestId(`join-game-button-${gameId}`);
  }

  spectateGameButton(gameId: string): Locator {
    return this.page.getByTestId(`spectate-game-button-${gameId}`);
  }

  async expectWaitingGameVisible(gameId: string): Promise<void> {
    await expect(this.waitingGameCard(gameId)).toBeVisible();
  }

  async expectActiveGameVisible(gameId: string): Promise<void> {
    await expect(this.activeGameCard(gameId)).toBeVisible();
  }

  async joinGame(gameId: string): Promise<void> {
    await this.joinGameButton(gameId).click();
  }

  async spectateGame(gameId: string): Promise<void> {
    await this.spectateGameButton(gameId).click();
  }
}
