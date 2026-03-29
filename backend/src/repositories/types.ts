import type { MultiplayerEvent, MultiplayerGame, MultiplayerGameStatus, ParticipantType } from '../domain/types.js';

export interface GameSummary {
  gameId: string;
  gameName: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  moveCount: number;
  winner: MultiplayerGame['winner'];
  terminalReason: MultiplayerGame['terminalReason'];
}

export interface ConnectionRecord {
  gameId: string;
  connectionId: string;
  participantType: ParticipantType;
  participantId: string;
  connectedAt: string;
  ttl?: number;
}

export interface GamesRepository {
  save(game: MultiplayerGame): Promise<void>;
  getById(gameId: string): Promise<MultiplayerGame | null>;
  listByStatus(status: MultiplayerGameStatus): Promise<GameSummary[]>;
  countByStatuses(statuses: MultiplayerGameStatus[]): Promise<number>;
}

export interface GameEventsRepository {
  append(gameId: string, events: MultiplayerEvent[]): Promise<void>;
  listByGameId(gameId: string): Promise<MultiplayerEvent[]>;
}

export interface ConnectionsRepository {
  put(record: ConnectionRecord): Promise<void>;
  delete(gameId: string, connectionId: string): Promise<void>;
  listByGameId(gameId: string): Promise<ConnectionRecord[]>;
  findByConnectionId(connectionId: string): Promise<ConnectionRecord | null>;
}

export interface BackendTableNames {
  gamesTableName: string;
  gameEventsTableName: string;
  connectionsTableName: string;
}
