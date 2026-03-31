export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type Board = CellValue[];
export type GameStatus = 'active' | 'won' | 'draw';

export interface Move {
  readonly player: Player;
  readonly position: number;
  readonly turn: number;
}

export interface GameState {
  readonly board: Board;
  readonly moves: Move[];
  readonly currentPlayer: Player;
  readonly winner: Player | null;
  readonly winningLine: readonly number[] | null;
  readonly status: GameStatus;
  readonly availableMoves: readonly number[];
  readonly isGameOver: boolean;
}

const BOARD_SIZE = 9;
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function createGameState(moves: readonly number[] = []): GameState {
  return moves.reduce((state, move) => applyMove(state, move), createEmptyGameState());
}

export function createEmptyGameState(): GameState {
  return deriveGameState({
    board: Array.from<CellValue>({ length: BOARD_SIZE }).fill(null),
    moves: [],
    currentPlayer: 'X',
  });
}

export function applyMove(state: GameState, position: number): GameState {
  validateMove(state, position);

  const nextBoard = [...state.board];
  nextBoard[position] = state.currentPlayer;

  const nextMoves: Move[] = [
    ...state.moves,
    {
      player: state.currentPlayer,
      position,
      turn: state.moves.length + 1,
    },
  ];

  return deriveGameState({
    board: nextBoard,
    moves: nextMoves,
    currentPlayer: togglePlayer(state.currentPlayer),
  });
}

export function canPlayMove(state: GameState, position: number): boolean {
  return (
    Number.isInteger(position) &&
    position >= 0 &&
    position < BOARD_SIZE &&
    !state.isGameOver &&
    state.board[position] === null
  );
}

export function validateMove(state: GameState, position: number): void {
  if (!Number.isInteger(position)) {
    throw new Error('Move position must be an integer.');
  }

  if (position < 0 || position >= BOARD_SIZE) {
    throw new Error('Move position must be between 0 and 8.');
  }

  if (state.isGameOver) {
    throw new Error('Cannot apply a move to a finished game.');
  }

  if (state.board[position] !== null) {
    throw new Error(`Cell ${position} is already occupied.`);
  }
}

export function togglePlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

export function findWinningLine(board: readonly CellValue[]): readonly number[] | null {
  for (const [a, b, c] of WINNING_LINES) {
    const candidate = board[a];

    if (candidate !== null && candidate === board[b] && candidate === board[c]) {
      return [a, b, c];
    }
  }

  return null;
}

export function getAvailableMoves(board: readonly CellValue[]): number[] {
  return board.flatMap((cell, index) => (cell === null ? [index] : []));
}

function deriveGameState(input: Pick<GameState, 'board' | 'moves' | 'currentPlayer'>): GameState {
  const winningLine = findWinningLine(input.board);
  const winner = winningLine ? input.board[winningLine[0]] : null;
  const availableMoves = getAvailableMoves(input.board);
  const status: GameStatus = winner ? 'won' : availableMoves.length === 0 ? 'draw' : 'active';

  return {
    board: input.board,
    moves: input.moves,
    currentPlayer: input.currentPlayer,
    winner,
    winningLine,
    status,
    availableMoves,
    isGameOver: status !== 'active',
  };
}
