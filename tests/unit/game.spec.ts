import { expect, test } from "@playwright/test";

import { Game } from "../../src/game/Game";

test.describe("Game", () => {
  test("rejects invalid moves and accepts a valid opening move", () => {
    const game = new Game();

    expect(game.placeMove(-1)).toBe(false);
    expect(game.placeMove(9)).toBe(false);
    expect(game.placeMove(0)).toBe(true);
    expect(game.placeMove(0)).toBe(false);
  });

  test("switches turns after each valid non-terminal move", () => {
    const game = new Game();

    expect(game.getCurrentPlayer()).toBe("X");
    expect(game.placeMove(0)).toBe(true);
    expect(game.getCurrentPlayer()).toBe("O");
    expect(game.placeMove(4)).toBe(true);
    expect(game.getCurrentPlayer()).toBe("X");
  });

  test("detects a representative winning line and ends the game immediately", () => {
    const game = new Game();

    game.placeMove(0);
    game.placeMove(3);
    game.placeMove(1);
    game.placeMove(4);
    game.placeMove(2);

    expect(game.getStatus()).toEqual({
      winner: "X",
      isDraw: false,
      isOver: true,
    });
    expect(game.placeMove(5)).toBe(false);
  });

  test("detects a draw and blocks further moves after game over", () => {
    const game = new Game();

    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((position) => {
      expect(game.placeMove(position)).toBe(true);
    });

    expect(game.getStatus()).toEqual({
      winner: null,
      isDraw: true,
      isOver: true,
    });
    expect(game.canPlaceMove(0)).toBe(false);
    expect(game.placeMove(0)).toBe(false);
  });
});
