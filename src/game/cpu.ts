import type { Cell, Player } from "./Game";

export type CpuStrategyStep =
  | "win"
  | "block"
  | "center"
  | "corner"
  | "side";

export type CpuDecision = {
  index: number;
  reason: CpuStrategyStep;
};

const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const CORNERS = [0, 2, 6, 8];
const SIDES = [1, 3, 5, 7];

function findWinningMove(board: Cell[], player: Player): number | null {
  for (const [a, b, c] of WINNING_LINES) {
    const line = [a, b, c];
    const marks = line.map((index) => board[index]);
    const playerCount = marks.filter((cell) => cell === player).length;
    const emptyIndex = line.find((index) => board[index] === null) ?? null;

    if (playerCount === 2 && emptyIndex !== null) {
      return emptyIndex;
    }
  }

  return null;
}

function findFirstAvailable(board: Cell[], candidates: number[]): number | null {
  for (const index of candidates) {
    if (board[index] === null) {
      return index;
    }
  }

  return null;
}

/**
 * Deterministic CPU strategy: win > block > center > corner > side.
 * Returns null if no legal moves remain.
 */
export function chooseCpuMove(
  board: Cell[],
  cpuPlayer: Player,
  humanPlayer: Player
): CpuDecision | null {
  const winIndex = findWinningMove(board, cpuPlayer);
  if (winIndex !== null) {
    return { index: winIndex, reason: "win" };
  }

  const blockIndex = findWinningMove(board, humanPlayer);
  if (blockIndex !== null) {
    return { index: blockIndex, reason: "block" };
  }

  if (board[4] === null) {
    return { index: 4, reason: "center" };
  }

  const cornerIndex = findFirstAvailable(board, CORNERS);
  if (cornerIndex !== null) {
    return { index: cornerIndex, reason: "corner" };
  }

  const sideIndex = findFirstAvailable(board, SIDES);
  if (sideIndex !== null) {
    return { index: sideIndex, reason: "side" };
  }

  return null;
}
