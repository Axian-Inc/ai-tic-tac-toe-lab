import { test, type Page, type TestInfo } from "@playwright/test";

export type StepAsync = (title: string, body: () => Promise<void>) => Promise<void>;

function toStepAttachmentName(stepTitle: string): string {
  return stepTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function createStepAsync(page: Page, testInfo: TestInfo): StepAsync {
  return async (title, body) => {
    await test.step(title, async () => {
      try {
        await body();
      } catch (error) {
        const attachmentName = toStepAttachmentName(title) || "unnamed-step";
        const screenshotPath = testInfo.outputPath(
          `step-failure-${attachmentName}.png`
        );

        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        await testInfo.attach(`failure-${attachmentName}`, {
          path: screenshotPath,
          contentType: "image/png",
        });

        throw error;
      }
    });
  };
}
