import { expect, test } from '@playwright/test';
import { chooseCell, startCpuGame } from './phase-1.fixtures.js';

test('P1-E2E-001: completes the canonical human win and starts a clean rematch', async ({ page }) => {
  await startCpuGame(page);

  await chooseCell(page, 0);
  await expect(page.getByRole('button', { name: 'Cell 2: O' })).toHaveAttribute('aria-disabled', 'true');
  await chooseCell(page, 3);
  await expect(page.getByRole('button', { name: 'Cell 3: O' })).toHaveAttribute('aria-disabled', 'true');
  await chooseCell(page, 6);

  await expect(page.getByTestId('game-status')).toHaveText('You win! Great game.');
  await expect(page.getByTestId('audio-cue')).toContainText('win sound requested');
  await expect(page.getByTestId('win-confetti')).toBeAttached();

  await page.getByRole('button', { name: 'Rematch' }).click();
  await expect(page.getByTestId('game-status')).toHaveText('Your turn — choose an open square.');
  await expect(page.getByRole('button', { name: 'Cell 1: empty' })).toBeEnabled();
});

test('P1-E2E-002: reports the canonical CPU win with retry feedback', async ({ page }) => {
  await startCpuGame(page);

  await chooseCell(page, 4);
  await expect(page.getByRole('button', { name: 'Cell 1: O' })).toHaveAttribute('aria-disabled', 'true');
  await chooseCell(page, 8);
  await expect(page.getByRole('button', { name: 'Cell 2: O' })).toHaveAttribute('aria-disabled', 'true');
  await chooseCell(page, 6);

  await expect(page.getByTestId('game-status')).toHaveText('CPU wins. Try again.');
  await expect(page.getByTestId('audio-cue')).toContainText('loss sound requested');
});

test('P1-E2E-003: prevents illegal placement and supports quitting', async ({ page }) => {
  await startCpuGame(page);
  await chooseCell(page, 0);

  const occupied = page.getByRole('button', { name: 'Cell 1: X' });
  await expect(occupied).toHaveAttribute('aria-disabled', 'true');
  await occupied.focus();
  await occupied.press('Enter');
  await expect(page.getByTestId('move-feedback')).toHaveText(
    'That square is unavailable. Choose an open square.',
  );

  await page.getByRole('button', { name: 'Quit game' }).click();
  await expect(page.getByRole('button', { name: 'Play vs. CPU' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Tic-Tac-Toe board' })).toHaveCount(0);
});
