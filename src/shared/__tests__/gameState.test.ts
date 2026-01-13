import { describe, expect, it } from 'vitest';

import { GameStateSchema } from '../gameState';

const emptyBoard = Array(9).fill(null);

describe('GameStateSchema', () => {
  it('accepts an in-progress empty board', () => {
    const payload = {
      board: emptyBoard,
      nextPlayer: 'X',
      gameStatus: 'in_progress',
      winner: null,
      opponentId: 'balanced',
      sessionId: 'session-001',
    };

    expect(GameStateSchema.parse(payload)).toEqual(payload);
  });

  it('accepts a mid-game state with move history', () => {
    const payload = {
      board: ['X', null, null, null, 'O', null, null, null, null],
      nextPlayer: 'X',
      gameStatus: 'in_progress',
      winner: null,
      opponentId: 'aggressive',
      sessionId: 'session-002',
      moveHistory: [
        { player: 'X', index: 0 },
        { player: 'O', index: 4 },
      ],
    };

    expect(GameStateSchema.parse(payload)).toEqual(payload);
  });

  it('accepts a draw state', () => {
    const payload = {
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      nextPlayer: 'O',
      gameStatus: 'draw',
      winner: null,
      opponentId: 'defensive',
      sessionId: 'session-003',
    };

    expect(GameStateSchema.parse(payload)).toEqual(payload);
  });

  it('rejects a board with invalid length', () => {
    const payload = {
      board: Array(8).fill(null),
      nextPlayer: 'X',
      gameStatus: 'in_progress',
      winner: null,
      opponentId: 'balanced',
      sessionId: 'session-004',
    };

    expect(() => GameStateSchema.parse(payload)).toThrow();
  });

  it('rejects a board with invalid symbols', () => {
    const payload = {
      board: ['X', 'O', 'Z', null, null, null, null, null, null],
      nextPlayer: 'X',
      gameStatus: 'in_progress',
      winner: null,
      opponentId: 'balanced',
      sessionId: 'session-005',
    };

    expect(() => GameStateSchema.parse(payload)).toThrow();
  });

  it('rejects missing nextPlayer', () => {
    const payload = {
      board: emptyBoard,
      gameStatus: 'in_progress',
      winner: null,
      opponentId: 'balanced',
      sessionId: 'session-006',
    };

    expect(() => GameStateSchema.parse(payload)).toThrow();
  });

  it('rejects invalid move history indexes', () => {
    const payload = {
      board: ['X', null, null, null, 'O', null, null, null, null],
      nextPlayer: 'X',
      gameStatus: 'in_progress',
      winner: null,
      opponentId: 'aggressive',
      sessionId: 'session-007',
      moveHistory: [{ player: 'X', index: 9 }],
    };

    expect(() => GameStateSchema.parse(payload)).toThrow();
  });
});
