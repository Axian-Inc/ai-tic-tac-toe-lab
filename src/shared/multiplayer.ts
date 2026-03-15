import type { GameState, Player } from "./game.js";

export type MultiplayerGameStatus = "waiting" | "active" | "over";

export interface MultiplayerPlayerSlot {
  player: Player;
  joinedAt: string;
}

export interface MultiplayerPlayerAssignments {
  X: MultiplayerPlayerSlot;
  O: MultiplayerPlayerSlot | null;
}

export interface MultiplayerGameSummary {
  id: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  openSeatCount: number;
}

export interface MultiplayerGameSnapshot extends MultiplayerGameSummary {
  players: MultiplayerPlayerAssignments;
  state: GameState;
}

export interface MultiplayerSession {
  gameId: string;
  player: Player;
  mode: "multiplayer";
}

export interface CreateGameResponse {
  game: MultiplayerGameSnapshot;
  joinCode: string;
  session: MultiplayerSession;
}

export interface JoinGameResponse {
  game: MultiplayerGameSnapshot;
  session: MultiplayerSession;
}

export interface GetGameResponse {
  game: MultiplayerGameSnapshot;
}

export interface MultiplayerMoveRequest {
  player: Player;
  position: number;
}

export interface SubmitMoveResponse {
  game: MultiplayerGameSnapshot;
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

export interface MultiplayerResyncNeededEvent {
  type: "resync-needed";
  game: MultiplayerGameSnapshot;
  reason: "player-joined" | "state-changed";
}

export type MultiplayerServerEvent =
  | MultiplayerConnectionReadyEvent
  | MultiplayerMoveAppliedEvent
  | MultiplayerGameOverEvent
  | MultiplayerResyncNeededEvent;

export interface ListGamesResponse {
  games: MultiplayerGameSummary[];
}
