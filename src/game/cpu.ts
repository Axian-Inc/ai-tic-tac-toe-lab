import { getCurrentPlayer, getLegalMoves, getWinner, isGameOver } from './gameEngine';
import type { Board, GameState, Move, Player } from './types';

const CENTER_POSITION = 4;
const CORNER_POSITIONS = [0, 2, 6, 8] as const;
const EDGE_POSITIONS = [1, 3, 5, 7] as const;

function getOpponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

function withPlacedMark(board: Board, position: number, player: Player): Board {
  const nextBoard = [...board] as Board;
  nextBoard[position] = player;
  return nextBoard;
}

function toMove(gameState: GameState, position: number): Move {
  return {
    moveNumber: gameState.moveHistory.length + 1,
    player: getCurrentPlayer(gameState),
    position,
  };
}

function findWinningPosition(gameState: GameState, player: Player): number | null {
  for (const position of getLegalMoves(gameState)) {
    const nextBoard = withPlacedMark(gameState.board, position, player);

    // Probe each legal move without mutating game state so the decision remains pure.
    if (getWinner(nextBoard) === player) {
      return position;
    }
  }

  return null;
}

function findPreferredPosition(gameState: GameState, positions: readonly number[]): number | null {
  const legalMoves = new Set(getLegalMoves(gameState));

  for (const position of positions) {
    if (legalMoves.has(position)) {
      return position;
    }
  }

  return null;
}

/**
 * Deterministic CPU rules, in fixed priority order:
 * 1. Take a winning move if one exists.
 * 2. Block the opponent's immediate winning move.
 * 3. Take the center square.
 * 4. Take the first available corner in fixed order: 0, 2, 6, 8.
 * 5. Take the first available edge in fixed order: 1, 3, 5, 7.
 */
export function chooseCpuMove(gameState: GameState): Move | null {
  if (isGameOver(gameState)) {
    return null;
  }

  const currentPlayer = getCurrentPlayer(gameState);
  const opponent = getOpponent(currentPlayer);

  // Keep this order stable so browser behavior and tests stay deterministic.
  const winningPosition = findWinningPosition(gameState, currentPlayer);
  if (winningPosition !== null) {
    return toMove(gameState, winningPosition);
  }

  const blockingPosition = findWinningPosition(gameState, opponent);
  if (blockingPosition !== null) {
    return toMove(gameState, blockingPosition);
  }

  const centerPosition = findPreferredPosition(gameState, [CENTER_POSITION]);
  if (centerPosition !== null) {
    return toMove(gameState, centerPosition);
  }

  const cornerPosition = findPreferredPosition(gameState, CORNER_POSITIONS);
  if (cornerPosition !== null) {
    return toMove(gameState, cornerPosition);
  }

  const edgePosition = findPreferredPosition(gameState, EDGE_POSITIONS);
  if (edgePosition !== null) {
    return toMove(gameState, edgePosition);
  }

  return null;
}
