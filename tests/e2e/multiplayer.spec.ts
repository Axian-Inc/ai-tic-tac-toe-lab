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

test('a spectator can watch an active multiplayer game update live', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const spectatorContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();
  const spectatorPage = await spectatorContext.newPage();

  await hostPage.goto('/');
  await hostPage.getByRole('button', { name: 'Multiplayer Lobby' }).click();
  await hostPage.getByRole('button', { name: 'Create Multiplayer Game' }).click();

  const hostGameIdText = await hostPage.getByText(/Game ID /).textContent();
  const hostGameId = hostGameIdText?.match(/Game ID ([^.]+)\./)?.[1];

  if (!hostGameId) {
    throw new Error('Host game id was not rendered.');
  }

  await guestPage.goto('/');
  await guestPage.getByRole('button', { name: 'Multiplayer Lobby' }).click();
  await guestPage.getByRole('button', { name: `Join ${hostGameId}` }).click();
  await expect(guestPage.getByRole('heading', { name: 'Live Server-Backed Tic Tac Toe' })).toBeVisible();

  await spectatorPage.goto('/');
  await spectatorPage.getByRole('button', { name: 'Spectate Live Games' }).click();
  await spectatorPage.getByRole('button', { name: 'Refresh Active Games' }).click();
  await expect(spectatorPage.getByRole('button', { name: `Watch ${hostGameId}` })).toBeVisible();
  await spectatorPage.getByRole('button', { name: `Watch ${hostGameId}` }).click();

  await expect(spectatorPage.getByRole('heading', { name: 'Live Spectator View' })).toBeVisible();
  await expect(spectatorPage.getByText('Watching a live match.')).toBeVisible();

  await hostPage.getByRole('button', { name: 'Cell 0' }).click();

  await expect(spectatorPage.getByRole('button', { name: 'Cell 0' })).toContainText('X');
  await expect(spectatorPage.getByText('Observed turn 1 at cell 0.')).toBeVisible();

  await hostContext.close();
  await guestContext.close();
  await spectatorContext.close();
});
