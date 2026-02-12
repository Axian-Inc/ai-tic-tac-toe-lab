import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

type Player = 'X' | 'O';
type Cell = Player | null;

export const HUMAN_PLAYER: Player = 'X';
export const CPU_PLAYER: Player = 'O';

type GameState = {
  board: Cell[];
  xIsNext: boolean;
};

const initialState: GameState = {
  board: Array(9).fill(null),
  xIsNext: true,
};

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

export function calculateWinner(board: Cell[]): Player | null {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startNewGame: (state) => {
      state.board = Array(9).fill(null);
      state.xIsNext = true;
    },
    playerMove: (state, action: PayloadAction<number>) => {
      const winner = calculateWinner(state.board);
      const index = action.payload;

      if (!state.xIsNext || winner || state.board[index]) {
        return;
      }

      state.board[index] = HUMAN_PLAYER;
      state.xIsNext = false;
    },
    cpuMove: (state, action: PayloadAction<number>) => {
      const winner = calculateWinner(state.board);
      const index = action.payload;

      if (state.xIsNext || winner || state.board[index]) {
        return;
      }

      state.board[index] = CPU_PLAYER;
      state.xIsNext = true;
    },
  },
});

export const { startNewGame, playerMove, cpuMove } = gameSlice.actions;

export const selectGameState = (state: RootState) => state.game;
export const selectBoard = (state: RootState) => state.game.board;
export const selectXIsNext = (state: RootState) => state.game.xIsNext;
export const selectWinner = createSelector(selectBoard, (board) =>
  calculateWinner(board)
);
export const selectIsDraw = createSelector(
  selectBoard,
  selectWinner,
  (board, winner) => !winner && board.every((cell) => cell !== null)
);
export const selectAvailableMoves = createSelector(selectBoard, (board) =>
  board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index): index is number => index !== null)
);

export default gameSlice.reducer;
