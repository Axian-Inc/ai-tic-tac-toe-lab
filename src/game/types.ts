export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = [
  [Cell, Cell, Cell],
  [Cell, Cell, Cell],
  [Cell, Cell, Cell],
]

export type Position = {
  row: number
  col: number
}

export type Move = Position & {
  player: Player
}

export type GameState = {
  board: Board
  currentPlayer: Player
  winner: Player | null
  isDraw: boolean
  moveHistory: Move[]
}
