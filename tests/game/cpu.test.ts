import { describe, expect, it } from 'vitest';
import { chooseCpuMove } from '../../src/game/cpu';
import { applyMove, createGame } from '../../src/game/gameEngine';

describe('chooseCpuMove', () => {
  it('returns the same move for the same board state', () => {
    const game = [0, 8, 1, 6].reduce((state, position) => applyMove(state, position), createGame());

    expect(chooseCpuMove(game)).toEqual(chooseCpuMove(game));
  });

  it('takes a winning move before any other priority', () => {
    const game = [0, 3, 1, 4].reduce((state, position) => applyMove(state, position), createGame());

    expect(chooseCpuMove(game)).toEqual({
      moveNumber: 5,
      player: 'X',
      position: 2,
    });
  });

  it('blocks the opponent winning move when needed', () => {
    const game = [0, 3, 1].reduce((state, position) => applyMove(state, position), createGame());

    expect(chooseCpuMove(game)).toEqual({
      moveNumber: 4,
      player: 'O',
      position: 2,
    });
  });

  it('never returns an illegal move', () => {
    const game = [0, 4, 8].reduce((state, position) => applyMove(state, position), createGame());
    const cpuMove = chooseCpuMove(game);

    expect(cpuMove).not.toBeNull();
    expect(game.legalMoves).toContain(cpuMove!.position);
    expect(game.board[cpuMove!.position]).toBeNull();
  });

  it('takes the center square when there is no immediate win or block', () => {
    const game = applyMove(createGame(), 0);

    expect(chooseCpuMove(game)).toEqual({
      moveNumber: 2,
      player: 'O',
      position: 4,
    });
  });

  it('takes corners in a fixed order after center is unavailable', () => {
    const game = applyMove(createGame(), 4);

    expect(chooseCpuMove(game)).toEqual({
      moveNumber: 2,
      player: 'O',
      position: 0,
    });
  });

  it('takes edges in a fixed order after center and corners are unavailable', () => {
    const game = [2, 0, 3, 5, 4, 6, 8].reduce(
      (state, position) => applyMove(state, position),
      createGame(),
    );

    expect(chooseCpuMove(game)).toEqual({
      moveNumber: 8,
      player: 'O',
      position: 1,
    });
  });

  it('returns null when the game is already over', () => {
    const game = [0, 3, 1, 4, 2].reduce((state, position) => applyMove(state, position), createGame());

    expect(chooseCpuMove(game)).toBeNull();
  });
});
