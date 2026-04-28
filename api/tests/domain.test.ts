import { describe, expect, it } from "vitest";
import type { CellValue, PlayerMark, StoredGame } from "../src/contracts.js";
import {
  applyMove,
  checkAbandonment,
  createEmptyBoard,
  createGame,
  getSeatForToken,
  hashPlayerToken,
  joinGame,
  resignGame,
  validateDisplayName,
} from "../src/domain.js";
import { ApiError } from "../src/errors.js";

const createdAt = "2026-04-26T00:00:00.000Z";
const later = "2026-04-26T00:01:00.000Z";

const tokenX = "token-x";
const tokenO = "token-o";

const makeActiveGame = (
  board: CellValue[] = createEmptyBoard(),
  currentTurn: PlayerMark = "X",
): StoredGame => ({
  id: "game_test",
  state: "active",
  board,
  currentTurn,
  winner: null,
  players: {
    X: {
      mark: "X",
      displayName: "alice",
      playerTokenHash: hashPlayerToken(tokenX),
      joinedAt: createdAt,
    },
    O: {
      mark: "O",
      displayName: "bob",
      playerTokenHash: hashPlayerToken(tokenO),
      joinedAt: createdAt,
    },
  },
  moveHistory: [],
  createdAt,
  updatedAt: createdAt,
  startedAt: createdAt,
  endedAt: null,
  lastMoveAt: null,
  abandonmentDeadlineAt: "2026-04-26T00:03:00.000Z",
  latestSequence: 2,
});

const expectApiError = (callback: () => unknown, code: string): void => {
  expect(callback).toThrow(ApiError);
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
  }
};

describe("display name validation", () => {
  it("accepts documented display-name characters", () => {
    expect(validateDisplayName("bob123")).toBe("bob123");
    expect(validateDisplayName("bob_123")).toBe("bob_123");
    expect(validateDisplayName("bob-123")).toBe("bob-123");
  });

  it("rejects invalid display names", () => {
    for (const value of ["", "bad name", "<script>", "a".repeat(25)]) {
      expectApiError(() => validateDisplayName(value), "INVALID_DISPLAY_NAME");
    }
  });
});

describe("game lifecycle", () => {
  it("creates a waiting game with one issued player token", () => {
    const { game, player, event } = createGame("alice", createdAt, "game_1", tokenX);

    expect(game.id).toBe("game_1");
    expect(game.state).toBe("waiting_for_players");
    expect(game.board).toEqual(createEmptyBoard());
    expect(player.playerToken).toBe(tokenX);
    expect(game.players[player.mark]?.playerTokenHash).toBe(hashPlayerToken(tokenX));
    expect(event.type).toBe("game.created");
    expect(event.sequence).toBe(1);
  });

  it("joins the second player and starts the game", () => {
    const { game: waitingGame, player: firstPlayer } = createGame("alice", createdAt, "game_1", tokenX);
    const { game, player, event } = joinGame(waitingGame, "bob", later, tokenO);

    expect(player.mark).toBe(firstPlayer.mark === "X" ? "O" : "X");
    expect(game.state).toBe("active");
    expect(["X", "O"]).toContain(game.currentTurn);
    expect(game.abandonmentDeadlineAt).toBe("2026-04-26T00:04:00.000Z");
    expect(event.type).toBe("game.joined");
  });

  it("rejects duplicate player display names", () => {
    const { game } = createGame("alice", createdAt, "game_1", tokenX);

    expectApiError(() => joinGame(game, "alice", later, tokenO), "DISPLAY_NAME_ALREADY_USED");
  });
});

describe("move validation", () => {
  it("accepts a valid move and refreshes the abandonment deadline", () => {
    const game = makeActiveGame();
    const seat = getSeatForToken(game, tokenX);
    const result = applyMove(game, seat, 4, later);

    expect(result.game.board[4]).toBe("X");
    expect(result.game.currentTurn).toBe("O");
    expect(result.game.moveHistory).toHaveLength(1);
    expect(result.game.abandonmentDeadlineAt).toBe("2026-04-26T00:04:00.000Z");
    expect(result.events[0].type).toBe("move.accepted");
  });

  it("rejects invalid player tokens and out-of-turn moves", () => {
    const game = makeActiveGame();

    expectApiError(() => getSeatForToken(game, "wrong"), "INVALID_PLAYER_TOKEN");
    expectApiError(() => applyMove(game, getSeatForToken(game, tokenO), 0, later), "NOT_YOUR_TURN");
  });

  it("rejects occupied cells", () => {
    const board = createEmptyBoard();
    board[0] = "O";
    const game = makeActiveGame(board);

    expectApiError(() => applyMove(game, getSeatForToken(game, tokenX), 0, later), "CELL_OCCUPIED");
  });
});

describe("terminal states", () => {
  const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  it.each(winningLines)("detects win line %j", (a, b, c) => {
    const board = createEmptyBoard();
    board[a] = "X";
    board[b] = "X";
    const oCells = board.flatMap((cell, index) => (cell === null && index !== c ? [index] : []));
    board[oCells[0]] = "O";
    board[oCells[1]] = "O";

    const result = applyMove(makeActiveGame(board), getSeatForToken(makeActiveGame(board), tokenX), c, later);

    expect(result.game.state).toBe("won");
    expect(result.game.winner).toBe("X");
    expect(result.events.map((event) => event.type)).toEqual(["move.accepted", "game.won"]);
  });

  it("detects draws", () => {
    const board: CellValue[] = ["X", "O", "X", "X", "O", "O", "O", "X", null];
    const game = makeActiveGame(board, "X");
    const result = applyMove(game, getSeatForToken(game, tokenX), 8, later);

    expect(result.game.state).toBe("draw");
    expect(result.game.winner).toBeNull();
    expect(result.events.map((event) => event.type)).toEqual(["move.accepted", "game.draw"]);
  });

  it("resigns active games with the opponent as winner", () => {
    const game = makeActiveGame();
    const result = resignGame(game, getSeatForToken(game, tokenX), later);

    expect(result.game.state).toBe("resigned");
    expect(result.game.winner).toBe("O");
    expect(result.events[0].type).toBe("game.resigned");
  });

  it("abandons games after the turn deadline", () => {
    const game = {
      ...makeActiveGame(createEmptyBoard(), "O"),
      abandonmentDeadlineAt: "2026-04-26T00:02:00.000Z",
    };
    const result = checkAbandonment(game, "2026-04-26T00:02:01.000Z");

    expect(result.abandoned).toBe(true);
    expect(result.game.state).toBe("abandoned");
    expect(result.game.winner).toBe("X");
    expect(result.events[0].type).toBe("game.abandoned");
  });

  it("does not abandon games before the turn deadline", () => {
    const game = makeActiveGame(createEmptyBoard(), "O");
    const result = checkAbandonment(game, "2026-04-26T00:02:59.000Z");

    expect(result.abandoned).toBe(false);
    expect(result.events).toHaveLength(0);
    expect(result.game.state).toBe("active");
  });
});
