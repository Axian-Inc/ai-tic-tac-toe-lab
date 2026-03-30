import { expect, type Locator, type Page } from "@playwright/test";

export class MultiplayerModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly createTab: Locator;
  readonly joinTab: Locator;
  readonly spectateTab: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.createTab = page.getByRole("button", { name: "Create" });
    this.joinTab = page.getByRole("button", { name: "Join" });
    this.spectateTab = page.getByRole("button", { name: "Spectate" });
    this.refreshButton = page.getByRole("button", { name: "Refresh" });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
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
}
