import { expect, test } from "@playwright/test";
import {
  CPU_MOVE_PRIORITY,
  abandonGame,
  chooseCpuMove,
  createGame,
  createNewGame,
  getCurrentController,
  getHumanMark,
  getLegalMoves,
  getStatus,
  getTerminalBanner,
  hasWinner,
  isCellDisabled,
  playMove,
  playTurn,
  type Game,
} from "../src/game";

const createActiveGame = (overrides: Partial<Game>): Game => ({
  board: Array(9).fill(null),
  currentPlayer: "X",
  winner: null,
  state: "active",
  moveHistory: [],
  mode: "player-vs-player",
  controllers: { X: "human", O: "human" },
  ...overrides,
});

const withMockedRandom = <T,>(values: number[], callback: () => T): T => {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };

  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
};

test.describe("game engine", () => {
  test("creates a new PvP game with an empty board and randomized starting player", () => {
    const game = createNewGame("player-vs-player");

    expect(game.board).toHaveLength(9);
    expect(game.board.every((cell) => cell === null)).toBeTruthy();
    expect(game.moveHistory).toEqual([]);
    expect(game.winner).toBeNull();
    expect(game.state).toBe("active");
    expect(game.mode).toBe("player-vs-player");
    expect(game.controllers).toEqual({ X: "human", O: "human" });
    expect(["X", "O"]).toContain(game.currentPlayer);
  });

  test("starting player selection is not hardcoded", () => {
    const startingPlayers = Array.from({ length: 50 }, () => createNewGame().currentPlayer);

    expect(startingPlayers.every((mark) => mark === "X" || mark === "O")).toBeTruthy();
    expect(new Set(startingPlayers).size).toBeGreaterThan(1);
  });

  test("creates a CPU game with exactly one human-controlled mark", () => {
    const game = createNewGame("player-vs-cpu");
    const controllers = Object.values(game.controllers);

    expect(game.mode).toBe("player-vs-cpu");
    expect(controllers.filter((controller) => controller === "human")).toHaveLength(1);
    expect(controllers.filter((controller) => controller === "cpu")).toHaveLength(1);
  });

  test("accepts a valid move and updates history", () => {
    const game = createActiveGame({});
    const result = playMove(game, "X", 0);

    expect(result.accepted).toBeTruthy();
    expect(result.game.board[0]).toBe("X");
    expect(result.game.moveHistory).toHaveLength(1);
    expect(result.game.moveHistory[0]).toEqual({
      moveNumber: 1,
      playerMark: "X",
      cellIndex: 0,
    });
    expect(result.game.currentPlayer).toBe("O");
  });

  test("creates a playable game session through the module entry point", () => {
    const game = createGame("player-vs-player");

    expect(game.board).toHaveLength(9);
    expect(game.moveHistory).toEqual([]);
    expect(game.state).toBe("active");
    expect(getCurrentController(game)).toBe("human");
  });

  test("rejects an occupied cell move", () => {
    const game = createActiveGame({
      board: ["X", null, null, null, null, null, null, null, null],
      currentPlayer: "O",
    });
    const result = playMove(game, "O", 0);

    expect(result.accepted).toBeFalsy();
    expect(result.game).toEqual(game);
  });

  test("rejects an out-of-turn move", () => {
    const game = createActiveGame({ currentPlayer: "X" });
    const result = playMove(game, "O", 4);

    expect(result.accepted).toBeFalsy();
    expect(result.game).toEqual(game);
  });

  test("rejects an out-of-range move", () => {
    const game = createActiveGame({});

    expect(playMove(game, "X", -1).accepted).toBeFalsy();
    expect(playMove(game, "X", 9).accepted).toBeFalsy();
  });

  test("detects horizontal, vertical, and diagonal wins", () => {
    const horizontal = playMove(
      createActiveGame({
        board: ["X", "X", null, "O", "O", null, null, null, null],
        currentPlayer: "X",
      }),
      "X",
      2,
    );
    const vertical = playMove(
      createActiveGame({
        board: ["X", "O", null, "X", "O", null, null, null, null],
        currentPlayer: "O",
      }),
      "O",
      7,
    );
    const diagonal = playMove(
      createActiveGame({
        board: ["X", "O", null, "O", "X", null, null, null, null],
        currentPlayer: "X",
      }),
      "X",
      8,
    );

    expect(horizontal.game.winner).toBe("X");
    expect(horizontal.game.state).toBe("won");
    expect(vertical.game.winner).toBe("O");
    expect(vertical.game.state).toBe("won");
    expect(diagonal.game.winner).toBe("X");
    expect(diagonal.game.state).toBe("won");
  });

  test("detects a draw and locks further moves", () => {
    const result = playMove(
      createActiveGame({
        board: ["X", "O", "X", "X", "O", "O", "O", "X", null],
        currentPlayer: "X",
      }),
      "X",
      8,
    );

    expect(result.game.winner).toBeNull();
    expect(result.game.state).toBe("draw");
    expect(playMove(result.game, "O", 0).accepted).toBeFalsy();
  });

  test("rejects moves after a win or draw", () => {
    const wonGame = createActiveGame({
      state: "won",
      winner: "X",
      board: ["X", "X", "X", null, null, null, null, null, null],
    });
    const drawGame = createActiveGame({
      state: "draw",
      board: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
    });

    expect(playMove(wonGame, "X", 3).accepted).toBeFalsy();
    expect(playMove(drawGame, "X", 0).accepted).toBeFalsy();
  });

  test("supports explicit abandonment and blocks later moves", () => {
    const game = createActiveGame({
      moveHistory: [{ moveNumber: 1, playerMark: "X", cellIndex: 0 }],
      board: ["X", null, null, null, null, null, null, null, null],
    });
    const abandoned = abandonGame(game);

    expect(abandoned.state).toBe("abandoned");
    expect(playMove(abandoned, abandoned.currentPlayer, 1).accepted).toBeFalsy();
  });

  test("playTurn records a move and advances turn order inside the module", () => {
    const game = createActiveGame({});
    const nextGame = playTurn(game, 0);

    expect(nextGame.board[0]).toBe("X");
    expect(nextGame.moveHistory).toEqual([{ moveNumber: 1, playerMark: "X", cellIndex: 0 }]);
    expect(nextGame.currentPlayer).toBe("O");
  });

  test("returns legal CPU moves only during CPU turns", () => {
    const game = createActiveGame({
      mode: "player-vs-cpu",
      currentPlayer: "O",
      board: ["X", null, "O", null, "X", null, null, null, null],
      controllers: { X: "human", O: "cpu" },
    });

    expect(getLegalMoves(game)).toEqual([1, 3, 5, 6, 7, 8]);
    expect(chooseCpuMove(game)).toBe(6);
  });

  test("does not return a CPU move when the current actor is human", () => {
    const game = createActiveGame({
      mode: "player-vs-cpu",
      controllers: { X: "human", O: "cpu" },
    });

    expect(chooseCpuMove(game)).toBeNull();
  });

  test("chooses the first legal cell from the deterministic CPU priority order", () => {
    const game = createActiveGame({
      mode: "player-vs-cpu",
      currentPlayer: "O",
      board: ["X", null, null, null, null, "X", null, null, "O"],
      controllers: { X: "human", O: "cpu" },
    });

    expect(CPU_MOVE_PRIORITY).toEqual([4, 0, 2, 6, 8, 1, 3, 5, 7]);
    expect(chooseCpuMove(game)).toBe(4);
  });

  test("falls through center, corners, then edges in the documented fixed order", () => {
    const cornersGame = createActiveGame({
      mode: "player-vs-cpu",
      currentPlayer: "O",
      board: ["X", null, null, null, "X", null, null, null, null],
      controllers: { X: "human", O: "cpu" },
    });
    const edgesGame = createActiveGame({
      mode: "player-vs-cpu",
      currentPlayer: "O",
      board: ["X", null, "X", null, "X", null, "X", null, "X"],
      controllers: { X: "human", O: "cpu" },
    });

    expect(chooseCpuMove(cornersGame)).toBe(2);
    expect(chooseCpuMove(edgesGame)).toBe(1);
  });

  test("playTurn immediately applies the CPU response in CPU mode", () => {
    const game = withMockedRandom([0.1, 0.1], () => createNewGame("player-vs-cpu"));
    const nextGame = playTurn(game, 0);

    expect(nextGame.board[0]).toBe("X");
    expect(nextGame.board[4]).toBe("O");
    expect(nextGame.moveHistory).toEqual([
      { moveNumber: 1, playerMark: "X", cellIndex: 0 },
      { moveNumber: 2, playerMark: "O", cellIndex: 4 },
    ]);
    expect(nextGame.currentPlayer).toBe("X");
    expect(getCurrentController(nextGame)).toBe("human");
  });

  test("supports CPU-first game initialization via controller assignment", () => {
    const game = withMockedRandom([0.8, 0.8], () => createNewGame("player-vs-cpu"));

    expect(game.currentPlayer).toBe("O");
    expect(game.controllers).toEqual({ X: "cpu", O: "human" });
  });

  test("new games reset prior game state and history", () => {
    const priorGame = createActiveGame({
      board: ["X", "O", "X", null, null, null, null, null, null],
      state: "abandoned",
      moveHistory: [
        { moveNumber: 1, playerMark: "X", cellIndex: 0 },
        { moveNumber: 2, playerMark: "O", cellIndex: 1 },
      ],
    });

    expect(priorGame.moveHistory).toHaveLength(2);

    const newGame = createNewGame("player-vs-cpu");

    expect(newGame.moveHistory).toEqual([]);
    expect(newGame.board.every((cell) => cell === null)).toBeTruthy();
    expect(newGame.winner).toBeNull();
    expect(newGame.state).toBe("active");
  });

  test("exposes derived state for the human player, winner, and status copy", () => {
    const wonGame = createActiveGame({
      mode: "player-vs-cpu",
      winner: "X",
      state: "won",
      controllers: { X: "human", O: "cpu" },
      board: ["X", "X", "X", "O", "O", null, null, null, null],
    });

    expect(getHumanMark(wonGame)).toBe("X");
    expect(hasWinner(wonGame)).toBeTruthy();
    expect(getTerminalBanner(wonGame)).toBe("You win");
    expect(getStatus(wonGame)).toEqual({
      heading: "You win",
      body: "Your X line ended the match. Start a new game to play again.",
    });
  });

  test("reports draw, resignation, and abandonment states without a winner banner regression", () => {
    const drawGame = createActiveGame({
      state: "draw",
      board: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
    });
    const resignedGame = createActiveGame({
      state: "resigned",
      winner: "O",
      board: ["X", "X", null, "O", "O", null, null, null, null],
    });
    const abandonedGame = createActiveGame({
      state: "abandoned",
      board: ["X", null, null, null, null, null, null, null, null],
    });

    expect(getTerminalBanner(drawGame)).toBe("Draw");
    expect(getStatus(drawGame)).toEqual({
      heading: "Draw",
      body: "All 9 cells are occupied and no winning line exists.",
    });
    expect(getTerminalBanner(resignedGame)).toBe("O wins");
    expect(getStatus(resignedGame)).toEqual({
      heading: "Player resigned",
      body: "Player O wins by resignation.",
    });
    expect(getTerminalBanner(abandonedGame)).toBeNull();
    expect(getStatus(abandonedGame)).toEqual({
      heading: "Game abandoned",
      body: "This match was ended explicitly before a win or draw.",
    });
  });

  test("marks cells as disabled when a move is unavailable", () => {
    const occupiedCellGame = createActiveGame({
      board: ["X", null, null, null, null, null, null, null, null],
      currentPlayer: "O",
    });
    const cpuTurnGame = createActiveGame({
      mode: "player-vs-cpu",
      currentPlayer: "O",
      controllers: { X: "human", O: "cpu" },
    });

    expect(isCellDisabled(occupiedCellGame, 0)).toBeTruthy();
    expect(isCellDisabled(cpuTurnGame, 1)).toBeTruthy();
    expect(isCellDisabled(createActiveGame({}), 1)).toBeFalsy();
  });
});
