import { expect, type Page } from '@playwright/test';

export const startCpuGame = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play vs. CPU' }).click();
  await expect(page.getByRole('group', { name: 'Tic-Tac-Toe board' })).toBeVisible();
  await expect(page.getByTestId('game-status')).toHaveText('Your turn — choose an open square.');
};

export const chooseCell = async (page: Page, cell: number) => {
  const button = page.getByRole('button', { name: `Cell ${cell + 1}: empty` });
  await expect(button).toBeEnabled();
  await button.click();
};
