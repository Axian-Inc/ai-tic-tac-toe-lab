import { describe, expect, it } from 'vitest';
import {
  applyMove,
  canPlayMove,
  chooseDeterministicCpuMove,
  createEmptyGameState,
  createGameState,
} from '../../src/features/game/model';

describe('game domain', () => {
  it('tracks move order, board state, and current player', () => {
    const state = createGameState([0, 4, 8]);

    expect(state.moves.map((move) => `${move.player}:${move.position}`)).toEqual([
      'X:0',
      'O:4',
      'X:8',
    ]);
    expect(state.board[0]).toBe('X');
    expect(state.board[4]).toBe('O');
    expect(state.board[8]).toBe('X');
    expect(state.currentPlayer).toBe('O');
    expect(state.status).toBe('active');
  });

  it('rejects illegal moves on occupied cells', () => {
    const state = createGameState([0, 4, 8]);

    expect(canPlayMove(state, 4)).toBe(false);
    expect(() => applyMove(state, 4)).toThrow(/already occupied/i);
  });

  it('detects wins and exposes the winning line', () => {
    const state = createGameState([0, 3, 1, 4, 2]);

    expect(state.status).toBe('won');
    expect(state.winner).toBe('X');
    expect(state.winningLine).toEqual([0, 1, 2]);
    expect(state.isGameOver).toBe(true);
  });

  it('detects draws when the board fills without a winner', () => {
    const state = createGameState([0, 1, 2, 4, 3, 5, 7, 6, 8]);

    expect(state.status).toBe('draw');
    expect(state.winner).toBeNull();
    expect(state.availableMoves).toHaveLength(0);
    expect(state.isGameOver).toBe(true);
  });

  it('chooses the same deterministic CPU response for the same board', () => {
    const state = createGameState([0]);

    expect(chooseDeterministicCpuMove(state, 'O')).toBe(4);
    expect(chooseDeterministicCpuMove(state, 'O')).toBe(4);
  });

  it('takes a winning move before any fallback priority', () => {
    const state = createGameState([0, 3, 8, 4, 1]);

    expect(chooseDeterministicCpuMove(state, 'O')).toBe(5);
  });

  it('blocks an immediate player win when needed', () => {
    const state = createGameState([0, 4, 1]);

    expect(chooseDeterministicCpuMove(state, 'O')).toBe(2);
  });

  it('starts from an empty game with the player turn active', () => {
    const state = createEmptyGameState();

    expect(state.moves).toEqual([]);
    expect(state.availableMoves).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(state.currentPlayer).toBe('X');
    expect(state.status).toBe('active');
  });
});
