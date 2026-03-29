import type { Board, CellValue, GameState, GameStatus, Move, Player } from './types';
import {
  calculateLegalMoves,
  calculateWinner,
  createEmptyBoard,
  getNextPlayer,
  isValidPosition,
} from '../../shared/ticTacToe';

function calculateStatus(winner: Player | null, legalMoves: number[]): GameStatus {
  if (winner) {
    return 'won';
  }

  if (legalMoves.length === 0) {
    return 'draw';
  }

  return 'in_progress';
}

function buildGameState(board: Board, moveHistory: Move[]): GameState {
  const winner = calculateWinner(board);
  const legalMoves = winner ? [] : calculateLegalMoves(board);
  const status = calculateStatus(winner, legalMoves);

  return {
    board,
    moveHistory,
    // Turn is derived from move count so state stays internally consistent.
    currentPlayer: moveHistory.length % 2 === 0 ? 'X' : 'O',
    winner,
    status,
    isGameOver: status !== 'in_progress',
    legalMoves,
  };
}

export function createGame(board: Board = createEmptyBoard(), moveHistory: Move[] = []): GameState {
  return buildGameState([...board] as Board, [...moveHistory]);
}

export function getLegalMoves(game: GameState): number[] {
  return [...game.legalMoves];
}

export function getWinner(game: GameState | Board): Player | null {
  return Array.isArray(game) ? calculateWinner(game as Board) : game.winner;
}

export function isGameOver(game: GameState): boolean {
  return game.isGameOver;
}

export function getCurrentPlayer(game: GameState): Player {
  return game.currentPlayer;
}

export function getMoveHistory(game: GameState): Move[] {
  return [...game.moveHistory];
}

export function applyMove(game: GameState, position: number): GameState {
  if (!isValidPosition(position) || game.isGameOver || !game.legalMoves.includes(position)) {
    return game;
  }

  const board = [...game.board] as CellValue[];
  const player = game.currentPlayer;
  board[position] = player;

  // Each move produces a brand new state snapshot for predictable UI updates and testing.
  const move: Move = {
    moveNumber: game.moveHistory.length + 1,
    player,
    position,
  };

  return buildGameState(board as Board, [...game.moveHistory, move]);
}

export function createInitialGameState(): GameState {
  return createGame();
}

export function makeMove(game: GameState, position: number): GameState {
  return applyMove(game, position);
}
