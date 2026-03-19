import { expect, test } from '@playwright/test'
import {
  createGame,
  getCpuMove,
  isMoveValid,
  makeMove,
  type GameState,
  type Position,
} from '../../src/game'

const findWinningLine = (): Position[] => {
  const start = createGame()

  const dfs = (state: GameState, moves: Position[]): Position[] | null => {
    if (state.winner === 'X') return moves
    if (state.winner === 'O' || state.isDraw) return null

    if (state.currentPlayer === 'X') {
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const position = { row, col }
          if (!isMoveValid(state, position)) continue
          const next = makeMove(state, position)
          const result = dfs(next, [...moves, position])
          if (result) return result
        }
      }
      return null
    }

    const cpuMove = getCpuMove(state.board)
    if (!cpuMove) return null
    return dfs(makeMove(state, cpuMove), moves)
  }

  const result = dfs(start, [])
  if (!result) {
    throw new Error('No winning line found for X.')
  }
  return result
}

const playWinningGame = async (
  page: Parameters<typeof test>[0]['page'],
  board: ReturnType<Parameters<typeof expect>[0]['locator']>,
) => {
  const winningMoves = findWinningLine()
  let state = createGame()

  for (const move of winningMoves) {
    await board.locator(`[data-testid="square-${move.row}-${move.col}"]`).click()
    state = makeMove(state, move)

    if (state.winner || state.isDraw) break

    await page.getByRole('button', { name: 'CPU Move' }).click()
    const cpuMove = getCpuMove(state.board)
    if (!cpuMove) break
    state = makeMove(state, cpuMove)

    if (state.winner || state.isDraw) break
  }
}

test('plays a full deterministic game and wins', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByText('Your turn.', { exact: true })).toBeVisible()
  const board = page.getByRole('grid', { name: 'Tic tac toe board' })
  await expect(board).toBeVisible()
  await expect(board.locator('button')).toHaveCount(9)

  await playWinningGame(page, board)

  await expect(page.getByText('You win!', { exact: true })).toBeVisible()
})

test('replays win effects after Play Again and a second win', async ({ page }) => {
  test.setTimeout(60000)

  await page.addInitScript(() => {
    class FakeAudioContext {
      state: AudioContextState = 'running'
      currentTime = 0
      destination = {}

      resume() {
        return Promise.resolve()
      }

      createOscillator() {
        const oscillator = {
          type: 'sine' as OscillatorType,
          frequency: {
            setValueAtTime: () => undefined,
            linearRampToValueAtTime: () => undefined,
          },
          connect: () => undefined,
          start: () => {
            if (oscillator.type === 'sine') {
              window.__winSoundCount = (window.__winSoundCount ?? 0) + 1
            }
          },
          stop: () => undefined,
        }

        return oscillator
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: () => undefined,
            exponentialRampToValueAtTime: () => undefined,
          },
          connect: () => undefined,
        }
      }
    }

    window.__winSoundCount = 0
    window.__winEffectsEventCount = 0
    window.addEventListener('tic-tac-toe:player-win-effects', () => {
      window.__winEffectsEventCount = (window.__winEffectsEventCount ?? 0) + 1
    })

    window.AudioContext = FakeAudioContext as typeof AudioContext
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Play' }).click()

  const board = page.getByRole('grid', { name: 'Tic tac toe board' })
  await expect(board).toBeVisible()

  await playWinningGame(page, board)
  await expect(page.getByText('You win!', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Play Again' }).click()
  await expect(page.getByText('Your turn.', { exact: true })).toBeVisible()

  await playWinningGame(page, board)
  await expect(page.getByText('You win!', { exact: true })).toBeVisible()

  await expect
    .poll(() => page.evaluate(() => window.__winSoundCount))
    .toBe(2)
  await expect
    .poll(() => page.evaluate(() => window.__winEffectsEventCount))
    .toBe(2)
})
