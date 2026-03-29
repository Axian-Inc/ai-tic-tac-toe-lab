import { expect, test, type Locator, type Page } from '@playwright/test';

function square(page: Page, position: number) {
  return page.getByRole('button', { name: `Square ${position}` });
}

async function forceClick(locator: Locator) {
  await expect(locator).toBeVisible();
  await locator.click({ force: true });
}

async function playSquare(page: Page, position: number) {
  await forceClick(square(page, position));
}

async function startCpuGame(page: Page) {
  await page.goto('/');
  await forceClick(page.getByRole('link', { name: 'Play vs CPU' }));
  await expect(page).toHaveURL(/\/game\/cpu$/);
}

async function expectCpuMove(page: Page, position: number) {
  await expect(square(page, position)).toHaveText('O');
  await expect(page.getByText('Your turn. Pick an open tile.')).toBeVisible();
}

test('starts a new game from the landing page', async ({ page }) => {
  await startCpuGame(page);

  await expect(page.getByRole('heading', { name: 'Tic Tac Toe' })).toBeVisible();
  await expect(page.getByText('Your turn. Pick an open tile.')).toBeVisible();
  await expect(square(page, 1)).toBeEnabled();
  await expect(square(page, 9)).toBeEnabled();
});

test('plays a full game against the CPU with deterministic winning-state updates', async ({ page }) => {
  await startCpuGame(page);

  await playSquare(page, 1);
  await expect(square(page, 1)).toHaveText('X');
  await expect(page.getByText('CPU is thinking...')).toBeVisible();
  await expectCpuMove(page, 5);

  await playSquare(page, 2);
  await expect(square(page, 2)).toHaveText('X');
  await expect(page.getByText('CPU is thinking...')).toBeVisible();
  await expectCpuMove(page, 3);

  await playSquare(page, 6);
  await expect(square(page, 6)).toHaveText('X');
  await expect(page.getByText('CPU is thinking...')).toBeVisible();
  await expect(square(page, 7)).toHaveText('O');
  await expect(page.getByText('CPU wins this round. Shake it off and try again.')).toBeVisible();

  for (const position of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    await expect(square(page, position)).toBeDisabled();
  }
});

test('prevents illegal moves through the UI and supports play again and home navigation', async ({ page }) => {
  await startCpuGame(page);

  await playSquare(page, 1);
  await expect(square(page, 1)).toHaveText('X');
  await expect(square(page, 1)).toBeDisabled();
  await expectCpuMove(page, 5);

  await forceClick(page.getByRole('button', { name: 'Play Again' }));
  await expect(page.getByText('Your turn. Pick an open tile.')).toBeVisible();

  for (const position of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    await expect(square(page, position)).toHaveText('');
    await expect(square(page, position)).toBeEnabled();
  }

  await forceClick(page.getByRole('link', { name: 'Home' }));
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Tic Tac Toe' })).toBeVisible();
});
