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
  completion: MultiplayerCompletion | null;
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

export interface MultiplayerCompletion {
  endReason: "win" | "draw" | "resignation";
  winner: Player | null;
  loser: Player | null;
  completedAt: string;
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
  | MultiplayerResyncNeededEvent;

export interface ListGamesResponse {
  games: MultiplayerGameSummary[];
}
