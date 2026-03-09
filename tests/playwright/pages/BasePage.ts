import { expect, type Page } from "@playwright/test";

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async expectTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }
}
