import type { BrowserContext, Page } from "@playwright/test";
import { GameplayPage } from "../page-objects/GameplayPage";
import { LandingPage } from "../page-objects/LandingPage";
import { MultiplayerModalPage } from "../page-objects/MultiplayerModalPage";

export class MultiplayerBrowserSession {
  readonly context: BrowserContext;
  readonly page: Page;
  readonly gameplayPage: GameplayPage;
  readonly landingPage: LandingPage;
  readonly multiplayerModalPage: MultiplayerModalPage;

  constructor(context: BrowserContext, page: Page) {
    this.context = context;
    this.page = page;
    this.gameplayPage = new GameplayPage(page);
    this.landingPage = new LandingPage(page);
    this.multiplayerModalPage = new MultiplayerModalPage(page);
  }

  static async create(
    createAutomationContext: () => Promise<BrowserContext>
  ): Promise<MultiplayerBrowserSession> {
    const context = await createAutomationContext();
    const page = await context.newPage();
    return new MultiplayerBrowserSession(context, page);
  }

  async close(): Promise<void> {
    await this.context.close();
  }
}
