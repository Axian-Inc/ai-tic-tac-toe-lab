import { describe, expect, it } from 'vitest';
import { getCpuMove } from './game';
import type { BoardCell } from './types';

function createBoard(cells: BoardCell[]): BoardCell[] {
  return [...cells];
}

describe('getCpuMove', () => {
  it('takes an immediate winning move before any other heuristic', () => {
    const board = createBoard(['O', 'O', null, 'X', null, null, 'X', null, null]);

    expect(getCpuMove(board, 'O')).toBe(2);
  });

  it('blocks an immediate player win when the CPU has no winning move', () => {
    const board = createBoard(['X', 'X', null, null, null, 'O', null, null, null]);

    expect(getCpuMove(board, 'O')).toBe(2);
  });

  it('prefers the center square when no win or block exists', () => {
    const board = createBoard(['X', null, null, null, null, null, null, null, null]);

    expect(getCpuMove(board, 'O')).toBe(4);
  });

  it('prefers the opposite corner over other empty corners and edges', () => {
    const board = createBoard(['X', null, null, null, 'O', null, null, null, null]);

    expect(getCpuMove(board, 'O')).toBe(8);
  });

  it('uses the lowest-index empty corner before considering edges', () => {
    const board = createBoard([null, null, null, null, 'X', null, null, null, 'O']);

    expect(getCpuMove(board, 'O')).toBe(0);
  });

  it('uses the lowest-index empty edge when no corners remain', () => {
    const board = createBoard(['X', null, 'O', 'O', 'X', 'X', 'X', 'O', 'O']);

    expect(getCpuMove(board, 'X')).toBe(1);
  });

  it('returns no move for a finished board state', () => {
    const wonBoard = createBoard(['X', 'X', 'X', 'O', 'O', null, null, null, null]);
    const drawBoard = createBoard(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']);

    expect(getCpuMove(wonBoard, 'O')).toBeNull();
    expect(getCpuMove(drawBoard, 'O')).toBeNull();
  });
});
