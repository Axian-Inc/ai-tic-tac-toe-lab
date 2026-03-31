export const MAX_CONCURRENT_MULTIPLAYER_GAMES = 25;
export const ABANDONMENT_TIMEOUT_MS = 3 * 60 * 1000;
export const BOARD_CELL_COUNT = 9;

export const MULTIPLAYER_GAME_STATUSES = ['waiting', 'active', 'over'] as const;
export const MULTIPLAYER_GAME_END_REASONS = ['win', 'draw', 'resigned', 'abandoned'] as const;
export const MULTIPLAYER_ROLES = ['host', 'guest', 'spectator'] as const;
export const MULTIPLAYER_PLAYER_MARKS = ['X', 'O'] as const;
export const MULTIPLAYER_EVENT_TYPES = [
  'game.snapshot',
  'game.player.joined',
  'game.move.accepted',
  'game.resigned',
  'game.abandoned',
  'game.ended',
] as const;

export const MULTIPLAYER_API_PATHS = {
  createGame: '/games',
  listGames: '/games',
  joinGame: '/games/:gameId/join',
  submitMove: '/games/:gameId/moves',
  resignGame: '/games/:gameId/resign',
  abandonmentCheck: '/games/:gameId/abandonment-check',
  websocket: '/ws?gameId=:gameId',
} as const;

export type MultiplayerGameStatus = (typeof MULTIPLAYER_GAME_STATUSES)[number];
export type MultiplayerGameEndReason = (typeof MULTIPLAYER_GAME_END_REASONS)[number];
export type MultiplayerRole = (typeof MULTIPLAYER_ROLES)[number];
export type MultiplayerPlayerMark = (typeof MULTIPLAYER_PLAYER_MARKS)[number];
export type MultiplayerEventType = (typeof MULTIPLAYER_EVENT_TYPES)[number];
export type MultiplayerGameId = string;
export type MultiplayerSessionId = string;
export type MultiplayerEventId = string;
export type BoardCellValue = MultiplayerPlayerMark | null;
export type MultiplayerListGamesFilter = MultiplayerGameStatus;

export interface MultiplayerMoveRecord {
  readonly turn: number;
  readonly player: MultiplayerPlayerMark;
  readonly position: number;
  readonly acceptedAt: string;
}

export interface MultiplayerParticipantSeat {
  readonly role: Exclude<MultiplayerRole, 'spectator'>;
  readonly player: MultiplayerPlayerMark;
  readonly sessionId: MultiplayerSessionId;
  readonly joinedAt: string;
}

export interface MultiplayerGameSummary {
  readonly id: MultiplayerGameId;
  readonly status: MultiplayerGameStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly moveCount: number;
  readonly hostJoined: boolean;
  readonly guestJoined: boolean;
  readonly winner: MultiplayerPlayerMark | null;
  readonly endReason: MultiplayerGameEndReason | null;
}

export interface MultiplayerGameState {
  readonly id: MultiplayerGameId;
  readonly status: MultiplayerGameStatus;
  readonly board: readonly BoardCellValue[];
  readonly currentPlayer: MultiplayerPlayerMark | null;
  readonly winner: MultiplayerPlayerMark | null;
  readonly winningLine: readonly number[] | null;
  readonly endReason: MultiplayerGameEndReason | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly lastMoveAt: string | null;
  readonly abandonmentDeadlineAt: string | null;
  readonly replayCursor: number;
  readonly players: {
    readonly host: MultiplayerParticipantSeat;
    readonly guest: MultiplayerParticipantSeat | null;
  };
  readonly moves: readonly MultiplayerMoveRecord[];
}

export interface ListGamesRequest {
  readonly status?: MultiplayerListGamesFilter;
}

export interface ListGamesResponse {
  readonly games: readonly MultiplayerGameSummary[];
}

export interface CreateGameRequest {}

export interface CreateGameResponse {
  readonly game: MultiplayerGameState;
  readonly participant: MultiplayerParticipantSeat;
  readonly event: GameSnapshotEvent;
}

export interface JoinGameRequest {}

export interface JoinGameResponse {
  readonly game: MultiplayerGameState;
  readonly participant: MultiplayerParticipantSeat;
  readonly event: PlayerJoinedEvent;
}

export interface SubmitMoveRequest {
  readonly sessionId: MultiplayerSessionId;
  readonly position: number;
  readonly expectedTurn: number;
}

export type SubmitMoveResponse = MutationResponse;

export interface ResignGameRequest {
  readonly sessionId: MultiplayerSessionId;
}

export type ResignGameResponse = MutationResponse;

export interface AbandonmentCheckRequest {
  readonly sessionId: MultiplayerSessionId;
  readonly observedAt?: string;
}

export interface MutationResponse {
  readonly game: MultiplayerGameState;
  readonly event: MultiplayerServerEvent;
}

export interface AbandonmentCheckResponse {
  readonly game: MultiplayerGameState;
  readonly wasAbandoned: boolean;
  readonly event: MultiplayerServerEvent | null;
}

interface BaseServerEvent {
  readonly eventId: MultiplayerEventId;
  readonly gameId: MultiplayerGameId;
  readonly sequence: number;
  readonly occurredAt: string;
}

export interface GameSnapshotEvent extends BaseServerEvent {
  readonly type: 'game.snapshot';
  readonly reason: 'initial' | 'resync';
  readonly game: MultiplayerGameState;
}

export interface PlayerJoinedEvent extends BaseServerEvent {
  readonly type: 'game.player.joined';
  readonly role: 'guest';
  readonly game: MultiplayerGameState;
}

export interface MoveAcceptedEvent extends BaseServerEvent {
  readonly type: 'game.move.accepted';
  readonly move: MultiplayerMoveRecord;
  readonly game: MultiplayerGameState;
}

export interface GameResignedEvent extends BaseServerEvent {
  readonly type: 'game.resigned';
  readonly role: Exclude<MultiplayerRole, 'spectator'>;
  readonly winner: MultiplayerPlayerMark;
  readonly game: MultiplayerGameState;
}

export interface GameAbandonedEvent extends BaseServerEvent {
  readonly type: 'game.abandoned';
  readonly abandonedRole: Exclude<MultiplayerRole, 'spectator'>;
  readonly winner: MultiplayerPlayerMark;
  readonly game: MultiplayerGameState;
}

export interface GameEndedEvent extends BaseServerEvent {
  readonly type: 'game.ended';
  readonly endReason: MultiplayerGameEndReason;
  readonly winner: MultiplayerPlayerMark | null;
  readonly game: MultiplayerGameState;
}

export type MultiplayerServerEvent =
  | GameSnapshotEvent
  | PlayerJoinedEvent
  | MoveAcceptedEvent
  | GameResignedEvent
  | GameAbandonedEvent
  | GameEndedEvent;
