import { describe, expect, it } from 'vitest';

import type { GameState } from '../gameState';
import { applyMove, computeStatus, validateMove } from '../gameRules';

const baseState: GameState = {
  board: Array(9).fill(null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-1',
};

describe('computeStatus', () => {
  it('detects a win', () => {
    const state: GameState = {
      ...baseState,
      board: ['X', 'X', 'X', null, 'O', null, 'O', null, null],
    };

    expect(computeStatus(state)).toEqual({ gameStatus: 'win', winner: 'X' });
  });

  it('detects a draw', () => {
    const state: GameState = {
      ...baseState,
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
    };

    expect(computeStatus(state)).toEqual({ gameStatus: 'draw', winner: null });
  });
});

describe('validateMove', () => {
  it('rejects occupied cells', () => {
    const state: GameState = {
      ...baseState,
      board: ['X', null, null, null, null, null, null, null, null],
      nextPlayer: 'O',
    };

    expect(validateMove(state, 0)).toEqual({
      ok: false,
      errorCode: 'INVALID_MOVE',
      message: 'cell is already occupied',
    });
  });

  it('rejects out-of-range moves', () => {
    expect(validateMove(baseState, 9)).toEqual({
      ok: false,
      errorCode: 'INVALID_MOVE',
      message: 'move index is out of range',
    });
  });

  it('rejects moves after a terminal state', () => {
    const state: GameState = {
      ...baseState,
      gameStatus: 'win',
      winner: 'X',
    };

    expect(validateMove(state, 1)).toEqual({
      ok: false,
      errorCode: 'TERMINAL_STATE',
      message: 'game is already complete',
    });
  });

  it('rejects out-of-turn moves', () => {
    const state: GameState = {
      ...baseState,
      board: ['X', null, null, null, null, null, null, null, null],
      nextPlayer: 'X',
    };

    expect(validateMove(state, 1)).toEqual({
      ok: false,
      errorCode: 'INVALID_MOVE',
      message: 'wrong player turn',
    });
  });
});

describe('applyMove', () => {
  it('applies a move and updates state immutably', () => {
    const result = applyMove(baseState, 4);

    expect(result).toEqual({
      state: {
        ...baseState,
        board: [null, null, null, null, 'X', null, null, null, null],
        nextPlayer: 'O',
        moveHistory: [{ player: 'X', index: 4 }],
        gameStatus: 'in_progress',
        winner: null,
      },
    });
  });
});
