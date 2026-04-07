import { expect, type Locator, type Page } from "@playwright/test";

export class ReplayPanel {
  readonly page: Page;
  readonly root: Locator;
  readonly title: Locator;
  readonly summary: Locator;
  readonly startButton: Locator;
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly returnToLiveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("replay-panel");
    this.title = page.locator(".gameplay-history-title");
    this.summary = page.locator(".gameplay-history-summary");
    this.startButton = page.getByTestId("replay-start-button");
    this.backButton = page.getByTestId("replay-back-button");
    this.nextButton = page.getByTestId("replay-next-button");
    this.returnToLiveButton = page.getByTestId("replay-return-live-button");
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectReplayMode(mode: "live" | "replay"): Promise<void> {
    await expect(this.root).toHaveAttribute("data-replay-mode", mode);
  }

  async expectTitleContains(text: string): Promise<void> {
    await expect(this.title).toContainText(text);
  }

  async expectSummaryContains(text: string): Promise<void> {
    await expect(this.summary).toContainText(text);
  }

  async start(): Promise<void> {
    await this.startButton.click();
  }

  async back(): Promise<void> {
    await this.backButton.click();
  }

  async next(): Promise<void> {
    await this.nextButton.click();
  }

  async returnToLive(): Promise<void> {
    await this.returnToLiveButton.click();
  }

  async expectBackDisabled(): Promise<void> {
    await expect(this.backButton).toBeDisabled();
  }

  async expectNextDisabled(): Promise<void> {
    await expect(this.nextButton).toBeDisabled();
  }

  async expectReturnToLiveDisabled(): Promise<void> {
    await expect(this.returnToLiveButton).toBeDisabled();
  }
}
