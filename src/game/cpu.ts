import { Game, type BoardCell } from "./Game";

const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Fixed ordering keeps equivalent-score choices deterministic.
const POSITION_PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function hasWinningLine(board: BoardCell[], player: "X" | "O"): boolean {
  return WINNING_LINES.some(
    ([a, b, c]) => board[a] === player && board[b] === player && board[c] === player
  );
}

function getAvailablePositions(board: BoardCell[]): number[] {
  return POSITION_PRIORITY.filter((position) => board[position] === null);
}

function scoreBoard(board: BoardCell[], depth: number): number | null {
  if (hasWinningLine(board, "O")) {
    return 10 - depth;
  }

  if (hasWinningLine(board, "X")) {
    return depth - 10;
  }

  if (board.every((cell) => cell !== null)) {
    return 0;
  }

  return null;
}

function minimax(board: BoardCell[], player: "X" | "O", depth: number): number {
  const score = scoreBoard(board, depth);

  if (score !== null) {
    return score;
  }

  const availablePositions = getAvailablePositions(board);

  if (player === "O") {
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const position of availablePositions) {
      board[position] = "O";
      const nextScore = minimax(board, "X", depth + 1);
      board[position] = null;
      bestScore = Math.max(bestScore, nextScore);
    }

    return bestScore;
  }

  let bestScore = Number.POSITIVE_INFINITY;

  for (const position of availablePositions) {
    board[position] = "X";
    const nextScore = minimax(board, "O", depth + 1);
    board[position] = null;
    bestScore = Math.min(bestScore, nextScore);
  }

  return bestScore;
}

export function getDeterministicCpuMovePosition(game: Game): number | null {
  const board = game.getBoard();
  const availablePositions = getAvailablePositions(board);

  if (availablePositions.length === 0) {
    return null;
  }

  let bestMove = availablePositions[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const position of availablePositions) {
    if (!game.canPlaceMove(position)) {
      continue;
    }

    board[position] = "O";
    const moveScore = minimax(board, "X", 1);
    board[position] = null;

    // Strictly greater preserves first-in-order tie breaking.
    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = position;
    }
  }

  return bestMove;
}
