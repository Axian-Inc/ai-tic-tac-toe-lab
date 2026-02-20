import { expect, test } from '@playwright/test';

test.describe('tic-tac-toe game flow', () => {
  test('player wins with a diagonal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /play vs\. cpu/i }).click();

    const status = page.getByText(/your turn \(x\)/i);
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 1/i }).click();
    await expect(page.getByText(/cpu is thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 5/i }).click();
    await expect(page.getByText(/cpu is thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 9/i }).click();
    await expect(page.getByText(/you win/i)).toBeVisible();
  });

  test('player loses when CPU completes the top row', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /play vs\. cpu/i }).click();

    const status = page.getByText(/your turn \(x\)/i);
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 5/i }).click();
    await expect(page.getByText(/cpu is thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 9/i }).click();
    await expect(page.getByText(/cpu is thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 7/i }).click();
    await expect(page.getByText(/cpu wins/i)).toBeVisible();
  });
});
