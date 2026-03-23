import { expect, test } from "@playwright/test";
import { Game, type GameState } from "../../src/shared/game";

function createInitialState(): GameState {
  return {
    board: ["X", null, null, null, "O", null, null, null, null],
    moves: [
      { order: 1, player: "X", position: 0 },
      { order: 2, player: "O", position: 4 },
    ],
    currentPlayer: "X",
    status: {
      winner: null,
      isDraw: false,
      isOver: false,
    },
  };
}

test.describe("shared Game immutability", () => {
  test("Game constructor clones the provided initial board, moves, and status objects", () => {
    const initialState = createInitialState();
    const game = new Game(initialState);

    initialState.board[0] = null;
    initialState.moves[0].position = 8;
    initialState.status.isOver = true;

    expect(game.getState()).toEqual(createInitialState());
  });

  test("Game.getState returns a deep clone that can be mutated without affecting internal state", () => {
    const game = new Game(createInitialState());
    const snapshot = game.getState();

    snapshot.board[0] = null;
    snapshot.moves[0].position = 8;
    snapshot.status.isOver = true;
    snapshot.currentPlayer = "O";

    expect(game.getState()).toEqual(createInitialState());
  });

  test("Game.getBoard returns a cloned board array that can be mutated without affecting internal state", () => {
    const game = new Game(createInitialState());
    const board = game.getBoard();
    board[0] = null;

    expect(game.getBoard()[0]).toBe("X");
  });

  test("Game.getMoves returns cloned move objects that can be mutated without affecting internal state", () => {
    const game = new Game(createInitialState());
    const moves = game.getMoves();
    moves[0].position = 8;

    expect(game.getMoves()[0]).toEqual({ order: 1, player: "X", position: 0 });
  });

  test("Game.getStatus returns a cloned status object that can be mutated without affecting internal state", () => {
    const game = new Game(createInitialState());
    const status = game.getStatus();
    status.isOver = true;
    status.winner = "X";

    expect(game.getStatus()).toEqual({ winner: null, isDraw: false, isOver: false });
  });

  test("Game state remains isolated after multiple snapshot reads and external mutations across reads", () => {
    const game = new Game(createInitialState());
    const firstState = game.getState();
    const secondState = game.getState();

    firstState.board[0] = null;
    secondState.moves[1].position = 6;
    firstState.status.isDraw = true;

    expect(game.getState()).toEqual(createInitialState());
  });
});
