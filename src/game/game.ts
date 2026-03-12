import type { Board, GameState, Move, Player, Position } from './types'

const BOARD_SIZE = 3

export const createEmptyBoard = (): Board => [
  [null, null, null],
  [null, null, null],
  [null, null, null],
]

export const createGame = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: 'X',
  winner: null,
  isDraw: false,
  moveHistory: [],
})

const isWithinBounds = (position: Position): boolean =>
  position.row >= 0 &&
  position.row < BOARD_SIZE &&
  position.col >= 0 &&
  position.col < BOARD_SIZE

export const getWinner = (board: Board): Player | null => {
  const lines: Array<[Position, Position, Position]> = [
    // Rows
    [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
    [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
    [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
    // Columns
    [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ],
    [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ],
    [
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ],
    // Diagonals
    [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ],
    [
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
    ],
  ]

  for (const line of lines) {
    const [a, b, c] = line
    const first = board[a.row][a.col]
    if (first && first === board[b.row][b.col] && first === board[c.row][c.col]) {
      return first
    }
  }

  return null
}

export const isDraw = (board: Board, winner: Player | null): boolean => {
  if (winner) return false
  return board.every((row) => row.every((cell) => cell !== null))
}

const cloneBoard = (board: Board): Board => board.map((row) => [...row]) as Board

export const isMoveValid = (state: GameState, position: Position): boolean => {
  if (!isWithinBounds(position)) return false
  if (state.winner || state.isDraw) return false
  return state.board[position.row][position.col] === null
}

export const makeMove = (state: GameState, position: Position): GameState => {
  if (!isMoveValid(state, position)) return state

  const nextBoard = cloneBoard(state.board)
  nextBoard[position.row][position.col] = state.currentPlayer

  const move: Move = { ...position, player: state.currentPlayer }
  const winner = getWinner(nextBoard)
  const draw = isDraw(nextBoard, winner)

  return {
    board: nextBoard,
    currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
    winner,
    isDraw: draw,
    moveHistory: [...state.moveHistory, move],
  }
}

const mulberry32 = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const boardSeed = (board: Board): number => {
  const flat = board.flat().map((cell) => (cell ?? '_')).join('')
  let hash = 2166136261
  for (let i = 0; i < flat.length; i += 1) {
    hash ^= flat.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const getCpuMove = (board: Board, seed?: number): Position | null => {
  const empty: Position[] = []
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === null) {
        empty.push({ row, col })
      }
    }
  }

  if (empty.length === 0) return null

  const rng = mulberry32(seed ?? boardSeed(board))
  const index = Math.floor(rng() * empty.length)
  return empty[index]
}
