export type PlayerMark = "X" | "O";
export type CellValue = PlayerMark | null;

export type GameState =
  | "waiting_for_players"
  | "active"
  | "won"
  | "draw"
  | "resigned"
  | "abandoned";

export type PlayerSeat = {
  mark: PlayerMark;
  displayName: string;
  playerTokenHash: string;
  joinedAt: string;
};

export type PublicPlayerSeat = Omit<PlayerSeat, "playerTokenHash">;

export type MoveRecord = {
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

export type StoredGame = {
  id: string;
  state: GameState;
  board: CellValue[];
  currentTurn: PlayerMark | null;
  winner: PlayerMark | null;
  players: Partial<Record<PlayerMark, PlayerSeat>>;
  moveHistory: MoveRecord[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
  abandonmentDeadlineAt: string | null;
  latestSequence: number;
};

export type PublicGame = Omit<StoredGame, "players"> & {
  players: Partial<Record<PlayerMark, PublicPlayerSeat>>;
  eventHistory: GameEvent[];
};

export type PublicGameSummary = {
  id: string;
  state: GameState;
  currentTurn: PlayerMark | null;
  players: Partial<Record<PlayerMark, PublicPlayerSeat>>;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  latestSequence: number;
};

export type IssuedPlayer = {
  mark: PlayerMark;
  displayName: string;
  playerToken: string;
};

export type ErrorCode =
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

export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export type ConnectionRole = "player" | "spectator";

export type ConnectionRecord = {
  connectionId: string;
  connectedAt: string;
  expiresAt: number;
  gameId?: string;
  role?: ConnectionRole;
  displayName?: string;
  playerMark?: PlayerMark;
};
