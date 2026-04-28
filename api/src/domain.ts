import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type {
  CellValue,
  GameEvent,
  GameEventType,
  IssuedPlayer,
  MoveRecord,
  PlayerMark,
  PlayerSeat,
  PublicGame,
  StoredGame,
} from "./contracts.js";
import { ApiError, badRequest } from "./errors.js";

export const DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const MAX_CONCURRENT_GAMES = 25;
export const TURN_TIMEOUT_MS = 180_000;

const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type MutationResult = {
  game: StoredGame;
  events: GameEvent[];
};

export const createEmptyBoard = (): CellValue[] => Array<CellValue>(9).fill(null);

export const nowIso = (): string => new Date().toISOString();

export const addTurnTimeout = (isoDate: string): string =>
  new Date(new Date(isoDate).getTime() + TURN_TIMEOUT_MS).toISOString();

export const validateDisplayName = (displayName: unknown): string => {
  if (typeof displayName !== "string") {
    throw badRequest("INVALID_DISPLAY_NAME", "Display name is required.");
  }

  const trimmed = displayName.trim();

  if (trimmed.length < 1 || trimmed.length > 24 || !DISPLAY_NAME_PATTERN.test(trimmed)) {
    throw badRequest(
      "INVALID_DISPLAY_NAME",
      "Display name must be 1-24 characters and use letters, numbers, underscores, or hyphens.",
    );
  }

  return trimmed;
};

export const validateCellIndex = (cellIndex: unknown): number => {
  if (!Number.isInteger(cellIndex) || (cellIndex as number) < 0 || (cellIndex as number) > 8) {
    throw badRequest("INVALID_CELL_INDEX", "Cell index must be an integer from 0 through 8.");
  }

  return cellIndex as number;
};

export const generateGameId = (): string => `game_${randomBytes(12).toString("hex")}`;

export const generatePlayerToken = (): string => randomBytes(32).toString("base64url");

export const hashPlayerToken = (playerToken: string): string =>
  createHash("sha256").update(playerToken).digest("hex");

export const isTokenHashMatch = (playerToken: string, expectedHash: string): boolean => {
  const actual = Buffer.from(hashPlayerToken(playerToken), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const randomMark = (): PlayerMark => (randomInt(0, 2) === 0 ? "X" : "O");

export const otherMark = (mark: PlayerMark): PlayerMark => (mark === "X" ? "O" : "X");

export const detectWinner = (board: CellValue[]): PlayerMark | null => {
  for (const [a, b, c] of WINNING_LINES) {
    const mark = board[a];
    if (mark !== null && mark === board[b] && mark === board[c]) {
      return mark;
    }
  }

  return null;
};

export const isDraw = (board: CellValue[]): boolean =>
  board.every((cell) => cell !== null) && detectWinner(board) === null;

export const toPublicGame = (
  game: StoredGame,
  eventHistory: GameEvent[] = [],
): PublicGame => ({
  ...game,
  players: Object.fromEntries(
    Object.entries(game.players).map(([mark, seat]) => [
      mark,
      seat === undefined
        ? undefined
        : {
            mark: seat.mark,
            displayName: seat.displayName,
            joinedAt: seat.joinedAt,
          },
    ]),
  ) as PublicGame["players"],
  eventHistory,
});

export const makeEvent = (
  game: StoredGame,
  sequence: number,
  type: GameEventType,
  createdAt: string,
  payload: Record<string, unknown>,
): GameEvent => ({
  gameId: game.id,
  sequence,
  type,
  createdAt,
  payload,
});

const eventStatePayload = (game: StoredGame): Record<string, unknown> => ({
  board: game.board,
  currentTurn: game.currentTurn,
  state: game.state,
  winner: game.winner,
});

export const createGame = (
  displayName: string,
  createdAt = nowIso(),
  id = generateGameId(),
  playerToken = generatePlayerToken(),
): { game: StoredGame; player: IssuedPlayer; event: GameEvent } => {
  const mark = randomMark();
  const seat: PlayerSeat = {
    mark,
    displayName,
    playerTokenHash: hashPlayerToken(playerToken),
    joinedAt: createdAt,
  };

  const game: StoredGame = {
    id,
    state: "waiting_for_players",
    board: createEmptyBoard(),
    currentTurn: null,
    winner: null,
    players: {
      [mark]: seat,
    },
    moveHistory: [],
    createdAt,
    updatedAt: createdAt,
    startedAt: null,
    endedAt: null,
    lastMoveAt: null,
    abandonmentDeadlineAt: null,
    latestSequence: 1,
  };

  return {
    game,
    player: {
      mark,
      displayName,
      playerToken,
    },
    event: makeEvent(game, 1, "game.created", createdAt, {
      ...eventStatePayload(game),
      playerMark: mark,
      displayName,
    }),
  };
};

export const joinGame = (
  game: StoredGame,
  displayName: string,
  joinedAt = nowIso(),
  playerToken = generatePlayerToken(),
): { game: StoredGame; player: IssuedPlayer; event: GameEvent } => {
  if (game.state !== "waiting_for_players") {
    throw new ApiError(409, "GAME_ALREADY_FULL", "Game is not waiting for another player.");
  }

  const occupiedSeats = Object.values(game.players);
  if (occupiedSeats.length >= 2) {
    throw new ApiError(409, "GAME_ALREADY_FULL", "Game already has two players.");
  }

  if (occupiedSeats.some((seat) => seat.displayName === displayName)) {
    throw new ApiError(409, "DISPLAY_NAME_ALREADY_USED", "Display name is already used in this game.");
  }

  const occupiedMark = occupiedSeats[0]?.mark;
  if (occupiedMark === undefined) {
    throw new ApiError(409, "GAME_ALREADY_FULL", "Game has no open player seat.");
  }

  const mark = otherMark(occupiedMark);
  const nextGame: StoredGame = {
    ...game,
    state: "active",
    currentTurn: randomMark(),
    players: {
      ...game.players,
      [mark]: {
        mark,
        displayName,
        playerTokenHash: hashPlayerToken(playerToken),
        joinedAt,
      },
    },
    updatedAt: joinedAt,
    startedAt: joinedAt,
    abandonmentDeadlineAt: addTurnTimeout(joinedAt),
    latestSequence: game.latestSequence + 1,
  };

  return {
    game: nextGame,
    player: {
      mark,
      displayName,
      playerToken,
    },
    event: makeEvent(nextGame, nextGame.latestSequence, "game.joined", joinedAt, {
      ...eventStatePayload(nextGame),
      playerMark: mark,
      displayName,
    }),
  };
};

export const getSeatForToken = (game: StoredGame, playerToken: unknown): PlayerSeat => {
  if (typeof playerToken !== "string" || playerToken.length === 0) {
    throw new ApiError(401, "INVALID_PLAYER_TOKEN", "A valid player token is required.");
  }

  const seat = Object.values(game.players).find((candidate) =>
    isTokenHashMatch(playerToken, candidate.playerTokenHash),
  );

  if (seat === undefined) {
    throw new ApiError(401, "INVALID_PLAYER_TOKEN", "A valid player token is required.");
  }

  return seat;
};

export const applyMove = (
  game: StoredGame,
  seat: PlayerSeat,
  cellIndex: number,
  movedAt = nowIso(),
): MutationResult & { move: MoveRecord } => {
  if (game.state !== "active") {
    throw new ApiError(409, "GAME_NOT_ACTIVE", "Game is not active.");
  }

  if (seat.mark !== game.currentTurn) {
    throw new ApiError(403, "NOT_YOUR_TURN", "It is not this player's turn.");
  }

  if (game.board[cellIndex] !== null) {
    throw new ApiError(409, "CELL_OCCUPIED", "Cell is already occupied.");
  }

  const board = [...game.board];
  board[cellIndex] = seat.mark;

  const move: MoveRecord = {
    moveNumber: game.moveHistory.length + 1,
    playerMark: seat.mark,
    displayName: seat.displayName,
    cellIndex,
    createdAt: movedAt,
  };

  const winner = detectWinner(board);
  const draw = winner === null && isDraw(board);
  const baseSequence = game.latestSequence + 1;
  const nextGame: StoredGame = {
    ...game,
    board,
    currentTurn: winner !== null || draw ? null : otherMark(seat.mark),
    winner,
    state: winner !== null ? "won" : draw ? "draw" : "active",
    moveHistory: [...game.moveHistory, move],
    updatedAt: movedAt,
    endedAt: winner !== null || draw ? movedAt : null,
    lastMoveAt: movedAt,
    abandonmentDeadlineAt: winner !== null || draw ? null : addTurnTimeout(movedAt),
    latestSequence: baseSequence + (winner !== null || draw ? 1 : 0),
  };

  const moveEvent = makeEvent(nextGame, baseSequence, "move.accepted", movedAt, {
    ...eventStatePayload(nextGame),
    moveNumber: move.moveNumber,
    playerMark: move.playerMark,
    displayName: move.displayName,
    cellIndex: move.cellIndex,
  });

  const events = [moveEvent];
  if (winner !== null) {
    events.push(
      makeEvent(nextGame, baseSequence + 1, "game.won", movedAt, {
        ...eventStatePayload(nextGame),
        winner,
      }),
    );
  } else if (draw) {
    events.push(
      makeEvent(nextGame, baseSequence + 1, "game.draw", movedAt, {
        ...eventStatePayload(nextGame),
      }),
    );
  }

  return { game: nextGame, events, move };
};

export const resignGame = (
  game: StoredGame,
  seat: PlayerSeat,
  resignedAt = nowIso(),
): MutationResult => {
  if (game.state !== "active") {
    throw new ApiError(409, "GAME_NOT_ACTIVE", "Game is not active.");
  }

  const winner = otherMark(seat.mark);
  const nextGame: StoredGame = {
    ...game,
    state: "resigned",
    currentTurn: null,
    winner,
    updatedAt: resignedAt,
    endedAt: resignedAt,
    abandonmentDeadlineAt: null,
    latestSequence: game.latestSequence + 1,
  };

  return {
    game: nextGame,
    events: [
      makeEvent(nextGame, nextGame.latestSequence, "game.resigned", resignedAt, {
        ...eventStatePayload(nextGame),
        resigningPlayer: seat.mark,
        winner,
      }),
    ],
  };
};

export const checkAbandonment = (
  game: StoredGame,
  checkedAt = nowIso(),
): MutationResult & { abandoned: boolean } => {
  if (game.state !== "active") {
    throw new ApiError(409, "GAME_NOT_ACTIVE", "Game is not active.");
  }

  if (game.abandonmentDeadlineAt === null || new Date(checkedAt) < new Date(game.abandonmentDeadlineAt)) {
    return { game, events: [], abandoned: false };
  }

  if (game.currentTurn === null) {
    throw new ApiError(409, "GAME_NOT_ACTIVE", "Active game does not have a current player.");
  }

  const timeoutLoser = game.currentTurn;
  const winner = otherMark(timeoutLoser);
  const nextGame: StoredGame = {
    ...game,
    state: "abandoned",
    currentTurn: null,
    winner,
    updatedAt: checkedAt,
    endedAt: checkedAt,
    abandonmentDeadlineAt: null,
    latestSequence: game.latestSequence + 1,
  };

  return {
    game: nextGame,
    abandoned: true,
    events: [
      makeEvent(nextGame, nextGame.latestSequence, "game.abandoned", checkedAt, {
        ...eventStatePayload(nextGame),
        timeoutLoser,
        winner,
      }),
    ],
  };
};
