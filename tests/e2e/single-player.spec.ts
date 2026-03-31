import { expect, test } from '@playwright/test';

test('player can complete a full winning game against the deterministic cpu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play vs. CPU' }).click();

  await page.getByRole('button', { name: 'Cell 0' }).click();
  await expect(page.getByText('Waiting on the CPU move.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cell 4' })).toContainText('O');

  await page.getByRole('button', { name: 'Cell 7' }).click();
  await expect(page.getByRole('button', { name: 'Cell 2' })).toContainText('O');

  await page.getByRole('button', { name: 'Cell 6' }).click();
  await expect(page.getByRole('button', { name: 'Cell 3' })).toContainText('O');

  await page.getByRole('button', { name: 'Cell 8' }).click();

  await expect(page.getByText('You won this round.')).toBeVisible();
  await expect(page.getByText('Victory achieved.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rematch' })).toBeVisible();
});
