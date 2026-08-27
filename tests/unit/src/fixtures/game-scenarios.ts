export type Mark = 'X' | 'O';

export interface ExpectedMove {
  player: Mark;
  cell: number;
}

/** Accepted sequences from contracts/game-domain.md; no product API assumptions. */
export const canonicalHumanWin: readonly ExpectedMove[] = [
  { player: 'X', cell: 0 },
  { player: 'O', cell: 1 },
  { player: 'X', cell: 3 },
  { player: 'O', cell: 2 },
  { player: 'X', cell: 6 },
];

export const canonicalCpuWin: readonly ExpectedMove[] = [
  { player: 'X', cell: 4 },
  { player: 'O', cell: 0 },
  { player: 'X', cell: 8 },
  { player: 'O', cell: 1 },
  { player: 'X', cell: 6 },
  { player: 'O', cell: 2 },
];

export const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;
