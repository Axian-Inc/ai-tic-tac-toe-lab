import { expect, test } from '@playwright/test';

test('two clients can create, join, and exchange a live multiplayer move', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await hostPage.goto('/');
  await hostPage.getByRole('button', { name: 'Multiplayer Lobby' }).click();
  await hostPage.getByRole('button', { name: 'Create Multiplayer Game' }).click();

  await expect(hostPage.getByText('Waiting for a second player.')).toBeVisible();

  const hostGameIdText = await hostPage.getByText(/Game ID /).textContent();
  const hostGameId = hostGameIdText?.match(/Game ID ([^.]+)\./)?.[1];

  if (!hostGameId) {
    throw new Error('Host game id was not rendered.');
  }

  await guestPage.goto('/');
  await guestPage.getByRole('button', { name: 'Multiplayer Lobby' }).click();
  await guestPage.getByRole('button', { name: 'Refresh Waiting Games' }).click();
  await expect(guestPage.getByRole('button', { name: `Join ${hostGameId}` })).toBeVisible();
  await guestPage.getByRole('button', { name: `Join ${hostGameId}` }).click();

  await expect(guestPage.getByText('Live Server-Backed Tic Tac Toe')).toBeVisible();
  await expect(hostPage.getByText('A second player joined the match.')).toBeVisible();
  await expect(hostPage.getByText(`Game ID ${hostGameId}.`)).toBeVisible();

  await hostPage.getByRole('button', { name: 'Cell 0' }).click();

  await expect(guestPage.getByRole('button', { name: 'Cell 0' })).toContainText('X');
  await expect(guestPage.getByRole('heading', { name: 'Your move is live.' })).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
