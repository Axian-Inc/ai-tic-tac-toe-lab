import { expect, test as base } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

type CoverageFixtures = {
  collectCoverage: void;
};

const shouldCollectCoverage = process.env.PLAYWRIGHT_COVERAGE === "1";

const test = shouldCollectCoverage
  ? base.extend<CoverageFixtures>({
      collectCoverage: [
        async ({ browserName, page }, use) => {
          if (browserName === "chromium") {
            await page.coverage.startJSCoverage({ resetOnNavigation: false });
          }

          await use();

          if (browserName === "chromium") {
            const coverage = await page.coverage.stopJSCoverage();
            if (coverage.length > 0) {
              await addCoverageReport(coverage, test.info());
            }
          }
        },
        { auto: true },
      ],
    })
  : base;

export { expect, test };
export type { Page } from "@playwright/test";
