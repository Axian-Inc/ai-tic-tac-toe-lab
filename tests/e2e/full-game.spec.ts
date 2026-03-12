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

test('plays a full deterministic game and wins', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('heading', { name: 'Your turn.' })).toBeVisible()
  const board = page.getByRole('grid', { name: 'Tic tac toe board' })
  await expect(board).toBeVisible()
  await expect(board.locator('button')).toHaveCount(9)

  const winningMoves = findWinningLine()
  let state = createGame()

  for (const move of winningMoves) {
    await board.locator(`[data-testid=\"square-${move.row}-${move.col}\"]`).click()
    state = makeMove(state, move)

    if (state.winner || state.isDraw) break

    await page.getByRole('button', { name: 'CPU Move' }).click()
    const cpuMove = getCpuMove(state.board)
    if (!cpuMove) break
    state = makeMove(state, cpuMove)

    if (state.winner || state.isDraw) break
  }

  await expect(page.getByRole('heading', { name: 'You win!' })).toBeVisible()
})
