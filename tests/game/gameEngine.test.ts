import { describe, expect, it } from 'vitest';
import {
  applyMove,
  createGame,
  createInitialGameState,
  getCurrentPlayer,
  getLegalMoves,
  getMoveHistory,
  getWinner,
  isGameOver,
  makeMove,
} from '../../src/game/gameEngine';

describe('gameEngine', () => {
  it('initializes a new game with an empty board and player X to move', () => {
    const state = createGame();

    expect(getCurrentPlayer(state)).toBe('X');
    expect(state.board.every((square) => square === null)).toBe(true);
    expect(getLegalMoves(state)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(getMoveHistory(state)).toEqual([]);
    expect(state.status).toBe('in_progress');
    expect(isGameOver(state)).toBe(false);
  });

  it('alternates turns and records applied legal moves in order', () => {
    const afterFirstMove = applyMove(createGame(), 0);
    const afterSecondMove = applyMove(afterFirstMove, 4);

    expect(getMoveHistory(afterSecondMove)).toEqual([
      { moveNumber: 1, player: 'X', position: 0 },
      { moveNumber: 2, player: 'O', position: 4 },
    ]);
    expect(afterSecondMove.board[0]).toBe('X');
    expect(afterSecondMove.board[4]).toBe('O');
    expect(getCurrentPlayer(afterSecondMove)).toBe('X');
  });

  it('detects a row win', () => {
    expect(getWinner(['X', 'X', 'X', null, null, null, null, null, null])).toBe('X');
  });

  it('detects a column win', () => {
    expect(getWinner(['O', null, null, 'O', null, null, 'O', null, null])).toBe('O');
  });

  it('detects a diagonal win from game state', () => {
    const winningGame = [0, 1, 4, 2, 8].reduce(
      (game, move) => applyMove(game, move),
      createGame(),
    );

    expect(getWinner(winningGame)).toBe('X');
    expect(winningGame.status).toBe('won');
    expect(isGameOver(winningGame)).toBe(true);
    expect(getLegalMoves(winningGame)).toEqual([]);
  });

  it('rejects illegal moves on taken squares and out-of-range positions', () => {
    const firstState = makeMove(createInitialGameState(), 0);
    const repeatedMoveState = makeMove(firstState, 0);
    const outOfRangeState = makeMove(firstState, 99);

    expect(repeatedMoveState).toEqual(firstState);
    expect(outOfRangeState).toEqual(firstState);
    expect(getMoveHistory(firstState)).toHaveLength(1);
  });

  it('detects a draw when all squares are filled without a winner', () => {
    const drawGame = [0, 1, 2, 4, 3, 5, 7, 6, 8].reduce(
      (game, move) => applyMove(game, move),
      createGame(),
    );

    expect(getWinner(drawGame)).toBeNull();
    expect(drawGame.status).toBe('draw');
    expect(isGameOver(drawGame)).toBe(true);
    expect(getLegalMoves(drawGame)).toEqual([]);
    expect(getMoveHistory(drawGame)).toHaveLength(9);
  });

  it('prevents further moves after the game is over', () => {
    const finishedGame = [0, 3, 1, 4, 2].reduce(
      (game, move) => applyMove(game, move),
      createGame(),
    );
    const attemptedExtraMove = applyMove(finishedGame, 5);

    expect(attemptedExtraMove).toEqual(finishedGame);
  });
});
