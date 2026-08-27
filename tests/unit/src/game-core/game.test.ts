import { describe, expect, it } from 'vitest';
import {
  WINNING_LINES,
  applyMove,
  chooseCpuMove,
  createGame,
  isLegalMove,
  quitGame,
  rematchGame,
  type GameState,
  type Mark,
} from '@tic-tac-toe/game-core';

const accept = (state: GameState, player: Mark, cell: number): GameState => {
  const transition = applyMove(state, player, cell);
  expect(transition.accepted).toBe(true);
  return transition.state;
};

const play = (...moves: ReadonlyArray<readonly [Mark, number]>): GameState =>
  moves.reduce((state, [player, cell]) => accept(state, player, cell), createGame());

describe('P1-GAME-001: game state transitions', () => {
  it('creates the canonical immutable initial state', () => {
    const state = createGame();

    expect(state).toEqual({
      board: Array(9).fill(null),
      moves: [],
      currentTurn: 'X',
      winner: null,
      status: 'playing',
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.board)).toBe(true);
    expect(Object.isFrozen(state.moves)).toBe(true);
  });

  it('records immutable moves in ply order and changes turn', () => {
    const initial = createGame();
    const afterX = accept(initial, 'X', 4);
    const afterO = accept(afterX, 'O', 0);

    expect(afterO.moves).toEqual([
      { ply: 1, player: 'X', cell: 4 },
      { ply: 2, player: 'O', cell: 0 },
    ]);
    expect(afterO.board).toEqual(['O', null, null, null, 'X', null, null, null, null]);
    expect(afterO.currentTurn).toBe('X');
    expect(initial.board.every((cell) => cell === null)).toBe(true);
    expect(Object.isFrozen(afterO.moves[0])).toBe(true);
  });

  const winCases: Array<[string, readonly [number, number, number], [number, number]]> = [
    ['top row', [0, 1, 2], [3, 4]],
    ['middle row', [3, 4, 5], [0, 1]],
    ['bottom row', [6, 7, 8], [0, 1]],
    ['left column', [0, 3, 6], [1, 2]],
    ['middle column', [1, 4, 7], [0, 2]],
    ['right column', [2, 5, 8], [0, 1]],
    ['descending diagonal', [0, 4, 8], [1, 2]],
    ['ascending diagonal', [2, 4, 6], [0, 1]],
  ];

  it('exports exactly the eight accepted winning lines', () => {
    expect(WINNING_LINES).toEqual(winCases.map(([, line]) => line));
  });

  it.each(winCases)('detects an X win on the %s', (_name, x, o) => {
    const state = play(
      ['X', x[0]],
      ['O', o[0]],
      ['X', x[1]],
      ['O', o[1]],
      ['X', x[2]],
    );

    expect(state).toMatchObject({ status: 'won', winner: 'X', currentTurn: null });
  });

  it('detects a full-board draw', () => {
    const state = play(
      ['X', 0], ['O', 1], ['X', 2], ['O', 4], ['X', 3],
      ['O', 5], ['X', 7], ['O', 6], ['X', 8],
    );

    expect(state).toMatchObject({ status: 'draw', winner: null, currentTurn: null });
  });
});

describe('P1-GAME-ILLEGAL-001: rejected moves', () => {
  it.each([
    [-1, 'out_of_range'],
    [9, 'out_of_range'],
    [1.5, 'out_of_range'],
    [Number.NaN, 'out_of_range'],
  ] as const)('rejects cell %s without mutation', (cell, reason) => {
    const state = createGame();
    const transition = applyMove(state, 'X', cell);

    expect(transition).toMatchObject({ accepted: false, reason });
    expect(transition.state).toBe(state);
  });

  it('rejects an occupied cell and wrong player without mutation', () => {
    const afterX = accept(createGame(), 'X', 4);

    for (const [player, cell, reason] of [
      ['O', 4, 'occupied'],
      ['X', 5, 'wrong_turn'],
    ] as const) {
      const transition = applyMove(afterX, player, cell);
      expect(transition).toMatchObject({ accepted: false, reason });
      expect(transition.state).toBe(afterX);
    }
  });

  it('rejects every move after a terminal result', () => {
    const won = play(['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2]);
    const transition = applyMove(won, 'O', 5);

    expect(transition).toMatchObject({ accepted: false, reason: 'game_over' });
    expect(transition.state).toBe(won);
  });

  it('reports legality only for empty in-range cells while playing', () => {
    expect(isLegalMove(createGame(), 0)).toBe(true);

    const afterX = accept(createGame(), 'X', 4);
    expect(isLegalMove(afterX, 0)).toBe(false);
    expect(isLegalMove(afterX, 4)).toBe(false);
    expect(isLegalMove(afterX, -1)).toBe(false);

    const quit = quitGame(afterX);
    expect(quit.accepted).toBe(true);
    expect(isLegalMove(quit.state, 0)).toBe(false);
  });
});

describe('P1-CPU-001: deterministic CPU policy', () => {
  it('returns the lowest legal cell for identical positions', () => {
    const state = accept(createGame(), 'X', 0);

    expect(Array.from({ length: 20 }, () => chooseCpuMove(state))).toEqual(Array(20).fill(1));
  });

  it('takes the lowest immediate win before a lower non-winning cell', () => {
    const state = play(['X', 4], ['O', 0], ['X', 8], ['O', 1], ['X', 6]);
    expect(chooseCpuMove(state)).toBe(2);
  });

  it('returns null when it is not a playable CPU turn', () => {
    expect(chooseCpuMove(createGame())).toBeNull();
    const won = play(['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2]);
    expect(chooseCpuMove(won)).toBeNull();
  });
});

describe('P1-GAME-LIFECYCLE-001: quit and rematch', () => {
  it('quits a playing game while preserving moves', () => {
    const playing = accept(createGame(), 'X', 4);
    const transition = quitGame(playing);

    expect(transition.accepted).toBe(true);
    expect(transition.state).toMatchObject({
      board: playing.board,
      moves: playing.moves,
      status: 'quit',
      currentTurn: null,
      winner: null,
    });
  });

  it('rejects quitting a terminal game with the same state reference', () => {
    const won = play(['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2]);
    const transition = quitGame(won);

    expect(transition).toMatchObject({ accepted: false, reason: 'game_over' });
    expect(transition.state).toBe(won);
  });

  it('creates a fresh X-first game without mutating the completed game', () => {
    const completed = play(['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2]);
    const snapshot = JSON.stringify(completed);
    const rematch = rematchGame(completed);

    expect(rematch).toEqual(createGame());
    expect(rematch).not.toBe(completed);
    expect(JSON.stringify(completed)).toBe(snapshot);
  });
});
