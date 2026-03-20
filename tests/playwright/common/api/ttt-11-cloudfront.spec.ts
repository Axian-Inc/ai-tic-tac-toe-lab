import { expect, test } from "@playwright/test";

const baseUrls = process.env.TTT11_BASE_URL?.split("|").map((value) => value.trim());
const cloudfrontUrl =
  baseUrls?.[0] ||
  process.env.TTT11_CLOUDFRONT_URL ||
  process.env.PLAYWRIGHT_CLOUDFRONT_URL;
const s3Url =
  baseUrls?.[1] || process.env.TTT11_S3_URL || process.env.PLAYWRIGHT_S3_URL;

test.describe("TTT-11 Terraform baseline", () => {
  test("CloudFront returns 200 and current app shell", async ({ request }) => {
    test.skip(!cloudfrontUrl, "Missing TTT11_BASE_URL or TTT11_CLOUDFRONT_URL");

    const response = await request.get(cloudfrontUrl!);
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("<title>Tic-Tac-Toe</title>");
    expect(body).toContain('<div id="root"></div>');
  });

  test("Direct S3 object access is denied", async ({ request }) => {
    test.skip(!s3Url, "Missing TTT11_BASE_URL or TTT11_S3_URL");

    const response = await request.get(s3Url!);
    expect(response.status()).toBe(403);
  });
});
