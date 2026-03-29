import type { Board, CellValue, Player } from '../../shared/ticTacToe';

export type { Board, CellValue, Player } from '../../shared/ticTacToe';

export interface Move {
  moveNumber: number;
  player: Player;
  position: number;
}

export type GameStatus = 'in_progress' | 'won' | 'draw';

export interface GameState {
  board: Board;
  moveHistory: Move[];
  currentPlayer: Player;
  winner: Player | null;
  status: GameStatus;
  isGameOver: boolean;
  legalMoves: number[];
}
