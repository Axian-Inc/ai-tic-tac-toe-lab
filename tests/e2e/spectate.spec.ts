import { expect, test } from '@playwright/test'

const activeGamesPayload = {
  games: [
    {
      id: 'spectate-game-1',
      status: 'active',
      name: 'Live Match',
      createdAt: '2026-03-30T20:00:00.000Z',
      updatedAt: '2026-03-30T20:01:00.000Z',
      currentPlayer: 'X',
      players: {
        X: 'misty_m1nx',
        O: 'zesty_potato3',
      },
    },
  ],
}

const currentGamePayload = {
  game: {
    id: 'spectate-game-1',
    status: 'active',
    name: 'Live Match',
    createdAt: '2026-03-30T20:00:00.000Z',
    updatedAt: '2026-03-30T20:01:00.000Z',
    players: {
      X: 'misty_m1nx',
      O: 'zesty_potato3',
    },
    state: {
      board: [
        [null, null, 'X'],
        ['X', 'O', null],
        ['O', null, null],
      ],
      currentPlayer: 'X',
      winner: null,
      isDraw: false,
      endReason: null,
      moveHistory: [
        { row: 0, col: 2, player: 'X' },
        { row: 1, col: 1, player: 'O' },
        { row: 1, col: 0, player: 'X' },
        { row: 2, col: 0, player: 'O' },
      ],
    },
  },
}

const liveUpdatePayload = {
  type: 'game_update',
  move: { row: 2, col: 2, player: 'X' },
  game: {
    ...currentGamePayload.game,
    updatedAt: '2026-03-30T20:01:15.000Z',
    state: {
      ...currentGamePayload.game.state,
      board: [
        [null, null, 'X'],
        ['X', 'O', null],
        ['O', null, 'X'],
      ],
      currentPlayer: 'O',
      moveHistory: [
        ...currentGamePayload.game.state.moveHistory,
        { row: 2, col: 2, player: 'X' },
      ],
    },
  },
}

test('spectates an active game and receives a live update', async ({ page }) => {
  test.setTimeout(60000)

  await page.addInitScript((payload) => {
    class FakeWebSocket extends EventTarget {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSING = 2
      static CLOSED = 3

      readyState = FakeWebSocket.CONNECTING
      url: string

      constructor(url: string) {
        super()
        this.url = url

        queueMicrotask(() => {
          this.readyState = FakeWebSocket.OPEN
          this.dispatchEvent(new Event('open'))

          setTimeout(() => {
            this.dispatchEvent(
              new MessageEvent('message', {
                data: JSON.stringify(payload),
              }),
            )
          }, 100)
        })
      }

      send() {}

      close() {
        this.readyState = FakeWebSocket.CLOSED
        this.dispatchEvent(new Event('close'))
      }
    }

    window.WebSocket = FakeWebSocket as typeof WebSocket
  }, liveUpdatePayload)

  await page.route('http://127.0.0.1:5174/games?status=active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(activeGamesPayload),
    })
  })

  await page.route('http://127.0.0.1:5174/games/spectate-game-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentGamePayload),
    })
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: 'Spectate' }).click()
  await expect(page.getByText('Live Games', { exact: true })).toBeVisible()
  await expect(page.getByText('Live Match', { exact: true })).toBeVisible()
  await expect(page.getByText('misty_m1nx vs zesty_potato3')).toBeVisible()

  await page.getByRole('button', { name: 'Spectate Game' }).click()

  await expect(page.getByText('misty_m1nx', { exact: true })).toBeVisible()
  await expect(page.getByText('zesty_potato3', { exact: true })).toBeVisible()
  await expect(page.getByText('misty_m1nx to move.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resign' })).toHaveCount(0)

  await expect(page.getByText('zesty_potato3 to move.', { exact: true })).toBeVisible()
  await expect(page.locator('[data-testid="square-2-2"]')).toContainText('X')
})
