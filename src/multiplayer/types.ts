import type { Board, Player } from '../game/types';

export type MultiplayerGameStatus = 'waiting' | 'active' | 'over';
export type MultiplayerTerminalReason = 'win' | 'draw' | 'resignation' | 'abandonment' | null;

export interface MultiplayerGameSnapshot {
  gameId: string;
  gameName: string;
  xPlayerName: string;
  oPlayerName: string | null;
  status: MultiplayerGameStatus;
  board: Board;
  nextMark: Player | null;
  moveCount: number;
  winner: Player | null;
  terminalReason: MultiplayerTerminalReason;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
}

export interface MultiplayerEvent {
  sequenceNumber: number;
  eventType: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface MultiplayerGameDetailsResponse {
  game: MultiplayerGameSnapshot;
  players: {
    X: { joined: boolean };
    O: { joined: boolean };
  };
  events: MultiplayerEvent[];
}

export interface WaitingGameSummary {
  gameId: string;
  gameName: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  moveCount: number;
  winner: Player | null;
  terminalReason: MultiplayerTerminalReason;
}

export interface ParticipantSession {
  playerId: string;
  mark: Player;
}

export interface CreateGameResponse {
  game: MultiplayerGameSnapshot;
  participant: {
    role: 'player';
    mark: Player;
    playerId: string;
  };
  links: {
    gameUrl: string | null;
  };
}

export interface JoinGameResponse {
  game: Pick<MultiplayerGameSnapshot, 'gameId' | 'gameName' | 'xPlayerName' | 'oPlayerName' | 'status' | 'nextMark'>;
  participant: {
    role: 'player';
    mark: Player;
    playerId: string;
  };
  links: {
    gameUrl: string | null;
  };
}

export interface MoveResponse {
  game: MultiplayerGameSnapshot;
  event: MultiplayerEvent;
}

export interface ResignResponse {
  game: MultiplayerGameSnapshot;
}

export interface SpectateResponse {
  spectator: {
    spectatorId: string;
  };
  game: {
    gameId: string;
    gameName: string;
    xPlayerName?: string;
    oPlayerName?: string | null;
    status: MultiplayerGameStatus;
  };
  websocket: {
    gameId: string;
  };
}

export interface AbandonmentCheckResponse {
  abandonmentChecked: true;
  game: MultiplayerGameSnapshot;
  result?: 'not_abandoned';
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}
