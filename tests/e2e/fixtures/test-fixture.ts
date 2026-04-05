import type { Browser, BrowserContextOptions } from "@playwright/test";
import { test as base } from "@playwright/test";
import { GameplayPage } from "../page-objects/GameplayPage";
import { LandingPage } from "../page-objects/LandingPage";
import { MultiplayerModalPage } from "../page-objects/MultiplayerModalPage";
import { ReplayPanel } from "../page-objects/ReplayPanel";
import { SinglePlayerDriver } from "../support/SinglePlayerDriver";
import { TestSupportApi } from "../support/TestSupportApi";
import { createStepAsync, type StepAsync } from "../support/step-async";
import { getUiAutomationRuntimeConfig } from "../../playwright/runtime";

interface UiFixture {
  gameplayPage: GameplayPage;
  landingPage: LandingPage;
  multiplayerModalPage: MultiplayerModalPage;
  replayPanel: ReplayPanel;
  singlePlayerDriver: SinglePlayerDriver;
  testSupportApi: TestSupportApi;
  StepAsync: StepAsync;
}

interface UiWorkerFixture {
  automationBrowser: Browser | null;
}

function buildBrowserContextOptions(
  baseOptions: BrowserContextOptions,
  projectUse: Record<string, unknown>,
  baseURL: string | undefined
): BrowserContextOptions {
  const contextOptionKeys = [
    "acceptDownloads",
    "baseURL",
    "bypassCSP",
    "clientCertificates",
    "colorScheme",
    "contrast",
    "deviceScaleFactor",
    "extraHTTPHeaders",
    "geolocation",
    "hasTouch",
    "httpCredentials",
    "ignoreHTTPSErrors",
    "isMobile",
    "javaScriptEnabled",
    "locale",
    "offline",
    "permissions",
    "proxy",
    "recordHar",
    "recordVideo",
    "reducedMotion",
    "screen",
    "serviceWorkers",
    "storageState",
    "strictSelectors",
    "timezoneId",
    "userAgent",
    "viewport",
  ] as const;

  const projectContextOptions = Object.fromEntries(
    contextOptionKeys.flatMap((key) => {
      const value = projectUse[key];
      return value === undefined ? [] : [[key, value]];
    })
  ) as BrowserContextOptions;

  return {
    ...projectContextOptions,
    ...baseOptions,
    baseURL,
  };
}

export const test = base.extend<UiFixture, UiWorkerFixture>({
  automationBrowser: [
    async ({ playwright }, use) => {
      const runtime = getUiAutomationRuntimeConfig(process.argv);

      if (runtime.browserTarget !== "RemoteCDP") {
        await use(null);
        return;
      }

      const browser = await playwright.chromium.connectOverCDP(
        runtime.remoteCdpEndpoint ?? "http://host.docker.internal:9222"
      );

      await use(browser);

      await browser.close();
    },
    { scope: "test" },
  ],
  context: async (
    { automationBrowser, baseURL, browser, contextOptions },
    use,
    testInfo
  ) => {
    const browserInstance = automationBrowser ?? browser;
    const resolvedContextOptions = buildBrowserContextOptions(
      contextOptions,
      testInfo.project.use as Record<string, unknown>,
      baseURL
    );
    const context = await browserInstance.newContext(resolvedContextOptions);

    await use(context);

    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();

    await use(page);
  },
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  gameplayPage: async ({ page }, use) => {
    await use(new GameplayPage(page));
  },
  multiplayerModalPage: async ({ page }, use) => {
    await use(new MultiplayerModalPage(page));
  },
  replayPanel: async ({ page }, use) => {
    await use(new ReplayPanel(page));
  },
  singlePlayerDriver: async ({ gameplayPage }, use) => {
    await use(new SinglePlayerDriver(gameplayPage));
  },
  testSupportApi: async ({}, use) => {
    await use(new TestSupportApi());
  },
  StepAsync: async ({ page }, use, testInfo) => {
    await use(createStepAsync(page, testInfo));
  },
});

export { expect } from "@playwright/test";
