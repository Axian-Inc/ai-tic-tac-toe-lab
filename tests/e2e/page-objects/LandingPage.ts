import { expect, type Locator, type Page } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly root: Locator;
  readonly playVsCpuButton: Locator;
  readonly multiplayerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("landing-page");
    this.playVsCpuButton = page.getByRole("button", { name: "Play vs CPU" });
    this.multiplayerButton = page.getByRole("button", { name: "Multiplayer" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.playVsCpuButton).toBeVisible();
    await expect(this.multiplayerButton).toBeVisible();
  }

  async startCpuGame(): Promise<void> {
    await this.playVsCpuButton.click();
  }

  async openMultiplayer(): Promise<void> {
    await this.multiplayerButton.click();
  }
}
