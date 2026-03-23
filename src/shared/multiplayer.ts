import type { GameState, Player } from "./game.js";

export type MultiplayerGameStatus = "waiting" | "active" | "over";

export const MULTIPLAYER_PLAYER_NAME_MAX_LENGTH = 32;
export const MULTIPLAYER_GAME_NAME_MAX_LENGTH = 48;
export const MULTIPLAYER_ABANDONMENT_TIMEOUT_MS = 3 * 60 * 1000;

export interface CreateGameRequest {
  playerName: string;
  gameName: string;
}

export interface MultiplayerPlayerSlot {
  player: Player;
  name?: string;
  joinedAt: string;
}

export interface MultiplayerPlayerAssignments {
  X: MultiplayerPlayerSlot;
  O: MultiplayerPlayerSlot | null;
}

export interface MultiplayerGameSummary {
  id: string;
  name: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  hostName: string;
  openSeatCount: number;
}

export interface MultiplayerGameSnapshot extends MultiplayerGameSummary {
  players: MultiplayerPlayerAssignments;
  state: GameState;
  completion: MultiplayerCompletion | null;
  history: MultiplayerGameHistory;
  activity: MultiplayerGameActivity;
}

export interface MultiplayerPlayerSession {
  gameId: string;
  role: "player";
  player: Player;
  mode: "multiplayer";
}

export interface MultiplayerSpectatorSession {
  gameId: string;
  role: "spectator";
  player: null;
  mode: "multiplayer";
}

export type MultiplayerSession =
  | MultiplayerPlayerSession
  | MultiplayerSpectatorSession;

export interface CreateGameResponse {
  game: MultiplayerGameSnapshot;
  joinCode: string;
  session: MultiplayerPlayerSession;
}

export interface JoinGameResponse {
  game: MultiplayerGameSnapshot;
  session: MultiplayerPlayerSession;
}

export interface GetGameResponse {
  game: MultiplayerGameSnapshot;
}

export interface GetGameRequestOptions {
  player?: Player;
  intent?: "sync" | "reconnect";
}

export interface MultiplayerMoveRequest {
  player: Player;
  position: number;
}

export interface SubmitMoveResponse {
  game: MultiplayerGameSnapshot;
}

export interface ResignGameRequest {
  player: Player;
}

export interface ResignGameResponse {
  game: MultiplayerGameSnapshot;
}

export interface AbandonmentCheckResponse {
  game: MultiplayerGameSnapshot;
}

export interface MultiplayerCompletion {
  endReason: "win" | "draw" | "resignation" | "abandonment";
  winner: Player | null;
  loser: Player | null;
  completedAt: string;
}

export interface MultiplayerGameActivity {
  lastProgressedAt: string;
  awaitingPlayer: Player | null;
  awaitingSince: string | null;
  abandonmentTimeoutMs: number;
  abandonmentDeadlineAt: string | null;
}

export interface MultiplayerHistoryRetention {
  mode: "process-memory";
  survivesServiceRestart: false;
}

export interface MultiplayerGameCreatedEvent {
  type: "game-created";
  sequence: number;
  occurredAt: string;
  player: Player;
}

export interface MultiplayerPlayerJoinedEvent {
  type: "player-joined";
  sequence: number;
  occurredAt: string;
  player: Player;
}

export interface MultiplayerGameCompletedEvent {
  type: "game-completed";
  sequence: number;
  occurredAt: string;
  completion: MultiplayerCompletion;
}

export type MultiplayerGameEvent =
  | MultiplayerGameCreatedEvent
  | MultiplayerPlayerJoinedEvent
  | MultiplayerGameCompletedEvent;

export interface MultiplayerGameHistory {
  retention: MultiplayerHistoryRetention;
  events: MultiplayerGameEvent[];
}

export interface MultiplayerConnectionReadyEvent {
  type: "connection-ready";
  game: MultiplayerGameSnapshot;
}

export interface MultiplayerMoveAppliedEvent {
  type: "move-applied";
  game: MultiplayerGameSnapshot;
  move: {
    player: Player;
    position: number;
  };
}

export interface MultiplayerGameOverEvent {
  type: "game-over";
  game: MultiplayerGameSnapshot;
}

export interface MultiplayerResignedEvent {
  type: "resigned";
  game: MultiplayerGameSnapshot;
  resignedPlayer: Player;
}

export interface MultiplayerAbandonedEvent {
  type: "abandoned";
  game: MultiplayerGameSnapshot;
  abandonedPlayer: Player;
}

export interface MultiplayerResyncNeededEvent {
  type: "resync-needed";
  game: MultiplayerGameSnapshot;
  reason: "player-joined" | "state-changed";
}

export type MultiplayerServerEvent =
  | MultiplayerConnectionReadyEvent
  | MultiplayerMoveAppliedEvent
  | MultiplayerGameOverEvent
  | MultiplayerResignedEvent
  | MultiplayerAbandonedEvent
  | MultiplayerResyncNeededEvent;

export interface ListGamesResponse {
  games: MultiplayerGameSummary[];
}
