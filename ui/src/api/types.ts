import type { CellValue, Game, GameState, PlayerMark } from "../game";

export type BackendGameState =
  | "waiting_for_players"
  | "active"
  | "won"
  | "draw"
  | "resigned"
  | "abandoned";

export type PublicPlayerSeat = {
  mark: PlayerMark;
  displayName: string;
  joinedAt: string;
};

export type ApiMoveRecord = {
  moveNumber: number;
  playerMark: PlayerMark;
  displayName: string;
  cellIndex: number;
  createdAt: string;
};

export type GameEventType =
  | "game.created"
  | "game.joined"
  | "move.accepted"
  | "game.won"
  | "game.draw"
  | "game.resigned"
  | "game.abandoned";

export type GameEvent = {
  gameId: string;
  sequence: number;
  type: GameEventType;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type PublicGame = {
  id: string;
  state: BackendGameState;
  board: CellValue[];
  currentTurn: PlayerMark | null;
  winner: PlayerMark | null;
  players: Partial<Record<PlayerMark, PublicPlayerSeat>>;
  moveHistory: ApiMoveRecord[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
  abandonmentDeadlineAt: string | null;
  latestSequence: number;
  eventHistory: GameEvent[];
};

export type IssuedPlayer = {
  mark: PlayerMark;
  displayName: string;
  playerToken: string;
};

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "CELL_OCCUPIED"
  | "DISPLAY_NAME_ALREADY_USED"
  | "GAME_ALREADY_FULL"
  | "GAME_LIMIT_REACHED"
  | "GAME_NOT_ACTIVE"
  | "GAME_NOT_FOUND"
  | "INTERNAL_ERROR"
  | "INVALID_CELL_INDEX"
  | "INVALID_DISPLAY_NAME"
  | "INVALID_PLAYER_TOKEN"
  | "NOT_FOUND"
  | "NOT_YOUR_TURN";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type OnlineRole = "player" | "spectator";

export type CreateGameResponse = {
  game: PublicGame;
  player: IssuedPlayer;
};

export type JoinGameResponse = CreateGameResponse;

export type GetGameResponse = {
  game: PublicGame;
};

export type GetEventsResponse = {
  events: GameEvent[];
};

export type MakeMoveResponse = {
  accepted: true;
  game: PublicGame;
  move: ApiMoveRecord;
};

export type ResignResponse = {
  game: PublicGame;
};

export type AbandonmentCheckResponse = {
  abandoned: boolean;
  game: PublicGame;
};

const normalizeBackendState = (state: BackendGameState): GameState => state;

export const normalizePublicGame = (publicGame: PublicGame): Game => ({
  board: publicGame.board,
  currentPlayer: publicGame.currentTurn ?? publicGame.winner ?? "X",
  winner: publicGame.winner,
  state: normalizeBackendState(publicGame.state),
  moveHistory: publicGame.moveHistory.map((move) => ({
    moveNumber: move.moveNumber,
    playerMark: move.playerMark,
    cellIndex: move.cellIndex,
  })),
  mode: "online-multiplayer",
  controllers: { X: "human", O: "human" },
  online: {
    id: publicGame.id,
    currentTurn: publicGame.currentTurn,
    latestSequence: publicGame.latestSequence,
    players: publicGame.players,
  },
});

export const isOnlineTerminalState = (state: GameState): boolean =>
  state === "won" || state === "draw" || state === "resigned" || state === "abandoned";
