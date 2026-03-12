import { describe, expect, it } from 'vitest'
import {
  createGame,
  createEmptyBoard,
  getCpuMove,
  getWinner,
  isDraw,
  makeMove,
  type Board,
  type GameState,
} from '../game'

const boardFromRows = (rows: Array<Array<'X' | 'O' | null>>): Board => [
  [rows[0][0], rows[0][1], rows[0][2]],
  [rows[1][0], rows[1][1], rows[1][2]],
  [rows[2][0], rows[2][1], rows[2][2]],
]

const withState = (board: Board, currentPlayer: 'X' | 'O' = 'X'): GameState => ({
  board,
  currentPlayer,
  winner: getWinner(board),
  isDraw: isDraw(board, getWinner(board)),
  moveHistory: [],
})

describe('createGame', () => {
  it('creates an empty board with X to move', () => {
    const game = createGame()
    expect(game.board).toEqual(createEmptyBoard())
    expect(game.currentPlayer).toBe('X')
    expect(game.winner).toBeNull()
    expect(game.isDraw).toBe(false)
    expect(game.moveHistory).toHaveLength(0)
  })
})

describe('makeMove', () => {
  it('places a piece, switches turns, and records history', () => {
    const game = createGame()
    const next = makeMove(game, { row: 0, col: 1 })

    expect(next.board[0][1]).toBe('X')
    expect(next.currentPlayer).toBe('O')
    expect(next.moveHistory).toHaveLength(1)
    expect(next.moveHistory[0]).toEqual({ row: 0, col: 1, player: 'X' })
  })

  it('rejects moves on occupied squares', () => {
    const game = makeMove(createGame(), { row: 0, col: 0 })
    const rejected = makeMove(game, { row: 0, col: 0 })

    expect(rejected).toBe(game)
    expect(rejected.moveHistory).toHaveLength(1)
  })

  it('rejects moves out of bounds', () => {
    const game = createGame()
    const rejected = makeMove(game, { row: 3, col: 0 })

    expect(rejected).toBe(game)
  })

  it('prevents moves after a win', () => {
    const board = boardFromRows([
      ['X', 'X', 'X'],
      [null, 'O', null],
      ['O', null, null],
    ])
    const game = withState(board, 'O')
    const rejected = makeMove(game, { row: 1, col: 0 })

    expect(rejected).toBe(game)
  })
})

describe('win detection', () => {
  it('detects row wins', () => {
    const board = boardFromRows([
      ['O', 'O', 'O'],
      ['X', null, 'X'],
      [null, null, null],
    ])
    expect(getWinner(board)).toBe('O')
  })

  it('detects column wins', () => {
    const board = boardFromRows([
      ['X', 'O', null],
      ['X', 'O', null],
      ['X', null, null],
    ])
    expect(getWinner(board)).toBe('X')
  })

  it('detects diagonal wins', () => {
    const board = boardFromRows([
      ['O', 'X', 'X'],
      [null, 'O', null],
      ['X', null, 'O'],
    ])
    expect(getWinner(board)).toBe('O')
  })
})

describe('draw detection', () => {
  it('detects a draw when board is full and no winner', () => {
    const board = boardFromRows([
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', 'X'],
    ])
    expect(getWinner(board)).toBeNull()
    expect(isDraw(board, null)).toBe(true)
  })
})

describe('deterministic cpu', () => {
  it('returns the same move for the same board', () => {
    const board = boardFromRows([
      ['X', null, null],
      [null, 'O', null],
      [null, null, null],
    ])
    const move1 = getCpuMove(board)
    const move2 = getCpuMove(board)

    expect(move1).toEqual(move2)
  })

  it('returns different moves for different seeds', () => {
    const board = boardFromRows([
      ['X', null, null],
      [null, 'O', null],
      [null, null, null],
    ])
    const move1 = getCpuMove(board, 1)
    const move2 = getCpuMove(board, 2)

    expect(move1).not.toEqual(move2)
  })

  it('returns null when no moves are available', () => {
    const board = boardFromRows([
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', 'X'],
    ])
    expect(getCpuMove(board)).toBeNull()
  })
})
