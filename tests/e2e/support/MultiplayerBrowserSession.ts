import type { BrowserContext, Page } from "@playwright/test";
import type { Player } from "../../../src/shared/game";
import { GameplayPage } from "../page-objects/GameplayPage";
import { LandingPage } from "../page-objects/LandingPage";
import { MultiplayerModalPage } from "../page-objects/MultiplayerModalPage";
import { ReplayPanel } from "../page-objects/ReplayPanel";

export class MultiplayerBrowserSession {
  readonly context: BrowserContext;
  readonly page: Page;
  readonly gameplayPage: GameplayPage;
  readonly landingPage: LandingPage;
  readonly multiplayerModalPage: MultiplayerModalPage;
  readonly replayPanel: ReplayPanel;

  constructor(context: BrowserContext, page: Page) {
    this.context = context;
    this.page = page;
    this.gameplayPage = new GameplayPage(page);
    this.landingPage = new LandingPage(page);
    this.multiplayerModalPage = new MultiplayerModalPage(page);
    this.replayPanel = new ReplayPanel(page);
  }

  static async create(
    createAutomationContext: () => Promise<BrowserContext>
  ): Promise<MultiplayerBrowserSession> {
    const context = await createAutomationContext();
    const page = await context.newPage();
    return new MultiplayerBrowserSession(context, page);
  }

  async gotoPlayerGame(gameId: string, player: Player): Promise<void> {
    const query = new URLSearchParams({
      mode: "multiplayer",
      gameId,
      player,
    });
    await this.page.goto(`/game?${query.toString()}`);
  }

  async gotoSpectatorGame(gameId: string): Promise<void> {
    const query = new URLSearchParams({
      mode: "multiplayer",
      gameId,
      role: "spectator",
    });
    await this.page.goto(`/game?${query.toString()}`);
  }

  async close(): Promise<void> {
    await this.context.close();
  }
}
