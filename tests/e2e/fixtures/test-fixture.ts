import { test as base } from "@playwright/test";
import { GameplayPage } from "../page-objects/GameplayPage";
import { LandingPage } from "../page-objects/LandingPage";
import { MultiplayerModalPage } from "../page-objects/MultiplayerModalPage";
import { createStepAsync, type StepAsync } from "../support/step-async";

interface UiFixture {
  gameplayPage: GameplayPage;
  landingPage: LandingPage;
  multiplayerModalPage: MultiplayerModalPage;
  StepAsync: StepAsync;
}

export const test = base.extend<UiFixture>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  gameplayPage: async ({ page }, use) => {
    await use(new GameplayPage(page));
  },
  multiplayerModalPage: async ({ page }, use) => {
    await use(new MultiplayerModalPage(page));
  },
  StepAsync: async ({ page }, use, testInfo) => {
    await use(createStepAsync(page, testInfo));
  },
});

export { expect } from "@playwright/test";
