import type { GameState } from './gameState';

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type MoveError = {
  errorCode: string;
  message: string;
};

type MoveValidationResult = { ok: true } | ({ ok: false } & MoveError);
type MoveApplyResult = { state: GameState } | MoveError;

const countSymbols = (board: GameState['board']) => {
  let xCount = 0;
  let oCount = 0;

  for (const cell of board) {
    if (cell === 'X') {
      xCount += 1;
    } else if (cell === 'O') {
      oCount += 1;
    }
  }

  return { xCount, oCount };
};

const expectedNextPlayer = (board: GameState['board']) => {
  const { xCount, oCount } = countSymbols(board);

  if (oCount > xCount) {
    return null;
  }

  if (xCount - oCount > 1) {
    return null;
  }

  return xCount === oCount ? 'X' : 'O';
};

const findWinner = (board: GameState['board']) => {
  for (const [a, b, c] of winningLines) {
    const value = board[a];
    if (value && value === board[b] && value === board[c]) {
      return value;
    }
  }

  return null;
};

export const computeStatus = (
  state: GameState,
): Pick<GameState, 'gameStatus' | 'winner'> => {
  const winner = findWinner(state.board);

  if (winner) {
    return { gameStatus: 'win', winner };
  }

  const isDraw = state.board.every((cell) => cell !== null);
  if (isDraw) {
    return { gameStatus: 'draw', winner: null };
  }

  return { gameStatus: 'in_progress', winner: null };
};

export const validateMove = (state: GameState, index: number): MoveValidationResult => {
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    return { ok: false, errorCode: 'INVALID_MOVE', message: 'move index is out of range' };
  }

  if (state.gameStatus !== 'in_progress') {
    return { ok: false, errorCode: 'TERMINAL_STATE', message: 'game is already complete' };
  }

  if (state.board[index] !== null) {
    return { ok: false, errorCode: 'INVALID_MOVE', message: 'cell is already occupied' };
  }

  const expectedPlayer = expectedNextPlayer(state.board);
  if (!expectedPlayer) {
    return { ok: false, errorCode: 'INCONSISTENT_STATE', message: 'board turn counts are invalid' };
  }

  if (state.nextPlayer !== expectedPlayer) {
    return { ok: false, errorCode: 'INVALID_MOVE', message: 'wrong player turn' };
  }

  return { ok: true };
};

export const applyMove = (state: GameState, index: number): MoveApplyResult => {
  const validation = validateMove(state, index);

  if (!validation.ok) {
    return { errorCode: validation.errorCode, message: validation.message };
  }

  const board = state.board.map((cell, cellIndex) =>
    cellIndex === index ? state.nextPlayer : cell,
  );
  const moveHistory = [...(state.moveHistory ?? []), { player: state.nextPlayer, index }];
  const { gameStatus, winner } = computeStatus({ ...state, board });

  return {
    state: {
      ...state,
      board,
      moveHistory,
      nextPlayer: state.nextPlayer === 'X' ? 'O' : 'X',
      gameStatus,
      winner,
    },
  };
};
