import { expect, test } from "@playwright/test";
import { Game, type GameState } from "../../src/game/Game";
import { getDeterministicCpuMovePosition } from "../../src/game/cpu";

function createGame(state: GameState): Game {
  return new Game(state);
}

test.describe("function getDeterministicCpuMovePosition", () => {
  test("chooses the center opening move on an empty board", () => {
    const game = createGame({
      board: Array(9).fill(null),
      moves: [],
      currentPlayer: "O",
      status: {
        winner: null,
        isDraw: false,
        isOver: false,
      },
    });

    expect(getDeterministicCpuMovePosition(game)).toBe(4);
  });

  test("takes an immediate winning move when one is available", () => {
    const game = createGame({
      board: ["X", "X", null, "O", "O", null, null, null, null],
      moves: [
        { order: 1, player: "X", position: 0 },
        { order: 2, player: "O", position: 3 },
        { order: 3, player: "X", position: 1 },
        { order: 4, player: "O", position: 4 },
      ],
      currentPlayer: "O",
      status: {
        winner: null,
        isDraw: false,
        isOver: false,
      },
    });

    expect(getDeterministicCpuMovePosition(game)).toBe(5);
  });

  test("blocks an immediate player win", () => {
    const game = createGame({
      board: ["X", "X", null, null, "O", null, null, null, "O"],
      moves: [
        { order: 1, player: "X", position: 0 },
        { order: 2, player: "O", position: 4 },
        { order: 3, player: "X", position: 1 },
        { order: 4, player: "O", position: 8 },
      ],
      currentPlayer: "O",
      status: {
        winner: null,
        isDraw: false,
        isOver: false,
      },
    });

    expect(getDeterministicCpuMovePosition(game)).toBe(2);
  });

  test("uses deterministic priority when multiple best moves are equivalent", () => {
    const game = createGame({
      board: [null, null, null, null, "X", null, null, null, null],
      moves: [{ order: 1, player: "X", position: 4 }],
      currentPlayer: "O",
      status: {
        winner: null,
        isDraw: false,
        isOver: false,
      },
    });

    expect(getDeterministicCpuMovePosition(game)).toBe(0);
  });

  test("returns null when no legal moves remain", () => {
    const game = createGame({
      board: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
      moves: [
        { order: 1, player: "X", position: 0 },
        { order: 2, player: "O", position: 1 },
        { order: 3, player: "X", position: 2 },
        { order: 4, player: "O", position: 4 },
        { order: 5, player: "X", position: 3 },
        { order: 6, player: "O", position: 5 },
        { order: 7, player: "X", position: 7 },
        { order: 8, player: "O", position: 6 },
        { order: 9, player: "X", position: 8 },
      ],
      currentPlayer: "O",
      status: {
        winner: null,
        isDraw: true,
        isOver: true,
      },
    });

    expect(getDeterministicCpuMovePosition(game)).toBeNull();
  });
});
