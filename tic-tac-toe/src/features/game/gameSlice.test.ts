import { chooseCpuMove } from './gameSlice';

describe('chooseCpuMove', () => {
  test('takes the lowest-index winning move when multiple are available', () => {
    const board: Array<'X' | 'O' | null> = ['O', 'O', null, 'O', 'O', null, 'X', 'X', null];
    const availableMoves = [2, 5, 8];

    expect(chooseCpuMove(board, availableMoves)).toBe(2);
  });

  test('falls back to the lowest available move when no winning move exists', () => {
    const board: Array<'X' | 'O' | null> = ['X', null, null, null, 'O', null, null, null, 'X'];
    const availableMoves = [1, 2, 3, 5, 6, 7];

    expect(chooseCpuMove(board, availableMoves)).toBe(1);
  });
});
