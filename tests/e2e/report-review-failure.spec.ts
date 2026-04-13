import { expect, test } from "./fixtures/test-fixture";

test.describe("Report Review Failure Probe", () => {
  test("REPORT-REVIEW intentional failure for HTML report review", async ({
    StepAsync,
    landingPage,
  }) => {
    test.skip(
      process.env.UI_REPORT_REVIEW_FAILURE !== "1",
      "Review-only failing probe runs only when UI_REPORT_REVIEW_FAILURE=1."
    );

    await StepAsync("Load the landing page for the review probe", async () => {
      await landingPage.goto();
      await landingPage.expectLoaded();
    });

    await StepAsync("Fail intentionally so the report includes one known failed step", async () => {
      await expect(landingPage.playVsCpuButton).toContainText(
        "Intentionally incorrect button text for report review"
      );
    });
  });
});
