export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type Board = [
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
  CellValue,
];

export const BOARD_SIZE = 9;

export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function createEmptyBoard(): Board {
  return [null, null, null, null, null, null, null, null, null];
}

export function getNextPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position >= 0 && position < BOARD_SIZE;
}

export function calculateWinner(board: Board): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    const cell = board[a];

    if (cell !== null && cell === board[b] && cell === board[c]) {
      return cell;
    }
  }

  return null;
}

export function calculateLegalMoves(board: Board): number[] {
  const legalMoves: number[] = [];

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] === null) {
      legalMoves.push(index);
    }
  }

  return legalMoves;
}
