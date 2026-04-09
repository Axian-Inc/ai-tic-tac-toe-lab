import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test, type Page, type TestInfo } from "@playwright/test";

export type StepAsync = (title: string, body: () => Promise<void>) => Promise<void>;

function toStepAttachmentName(stepTitle: string): string {
  return stepTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function createStepAsync(page: Page, testInfo: TestInfo): StepAsync {
  let stepIndex = 0;

  return async (title, body) => {
    stepIndex += 1;

    await test.step(title, async () => {
      try {
        await body();
      } catch (error) {
        const attachmentName =
          `${String(stepIndex).padStart(2, "0")}-${toStepAttachmentName(title) || "unnamed-step"}`;
        const tempDir = await mkdtemp(join(tmpdir(), "ttt-step-failure-"));
        const screenshotPath = join(tempDir, `${attachmentName}.png`);

        try {
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
          });

          await testInfo.attach(`failure-${attachmentName}`, {
            path: screenshotPath,
            contentType: "image/png",
          });
        } finally {
          await rm(tempDir, { recursive: true, force: true });
        }

        throw error;
      }
    });
  };
}
