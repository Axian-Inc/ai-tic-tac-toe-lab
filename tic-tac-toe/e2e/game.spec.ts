import { expect, test } from '@playwright/test';

test.describe('tic-tac-toe game flow', () => {
  test('player can place an X in the middle square', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /single player/i }).click();
    await page.getByRole('button', { name: /start single player/i }).click();

    const middleSquare = page.getByRole('button', { name: /square 5/i });

    await expect(middleSquare).toHaveText('');
    await middleSquare.click();
    await expect(middleSquare).toHaveText('X');
  });

  test('player wins with a diagonal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /single player/i }).click();
    await page.getByRole('button', { name: /start single player/i }).click();

    const status = page.getByText(/your turn \(x\)/i);
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 1/i }).click();
    await expect(page.getByText(/cpu thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 5/i }).click();
    await expect(page.getByText(/cpu thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 9/i }).click();
    await expect(page.getByText(/you win/i)).toBeVisible();
  });

  test('player loses when CPU completes the top row', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /single player/i }).click();
    await page.getByRole('button', { name: /start single player/i }).click();

    const status = page.getByText(/your turn \(x\)/i);
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 5/i }).click();
    await expect(page.getByText(/cpu thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 9/i }).click();
    await expect(page.getByText(/cpu thinking/i)).toBeVisible();
    await expect(status).toBeVisible();

    await page.getByRole('button', { name: /square 7/i }).click();
    await expect(page.getByText(/cpu wins/i)).toBeVisible();
  });
});
