import type { Board, Player } from '../../../shared/ticTacToe.js';

export type MultiplayerGameStatus = 'waiting' | 'active' | 'over';
export type TerminalReason = 'win' | 'draw' | 'resignation' | 'abandonment' | null;
export type ParticipantType = 'player' | 'spectator';
export type MultiplayerEventType =
  | 'game_created'
  | 'player_joined'
  | 'move_accepted'
  | 'game_resigned'
  | 'abandonment_checked'
  | 'game_over';

export interface MultiplayerMove {
  sequenceNumber: number;
  mark: Player;
  position: number;
  createdAt: string;
  playerId: string;
}

export interface MultiplayerGame {
  gameId: string;
  gameName: string;
  xPlayerName: string;
  oPlayerName: string | null;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
  xPlayerId: string;
  oPlayerId: string | null;
  board: Board;
  nextMark: Player | null;
  winner: Player | null;
  terminalReason: TerminalReason;
  moveCount: number;
  lastEventSequenceNumber: number;
  moves: MultiplayerMove[];
}

export interface MultiplayerEvent<TPayload = Record<string, unknown>> {
  sequenceNumber: number;
  type: MultiplayerEventType;
  createdAt: string;
  payload: TPayload;
}

export interface DomainResult {
  game: MultiplayerGame;
  events: MultiplayerEvent[];
}

export interface AbandonmentCheckResult extends DomainResult {
  abandoned: boolean;
}
