import type { Board } from '../../../shared/ticTacToe.js';
import type { MultiplayerEvent, MultiplayerGame } from '../domain/types.js';
import type { ConnectionRecord, GameSummary } from './types.js';

type DynamoGameItem = {
  gameId: string;
  gameName?: string;
  xPlayerName?: string;
  oPlayerName?: string | null;
  status: MultiplayerGame['status'];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
  xPlayerId: string;
  oPlayerId: string | null;
  board: Board;
  nextMark: MultiplayerGame['nextMark'];
  winner: MultiplayerGame['winner'];
  terminalReason: MultiplayerGame['terminalReason'];
  moveCount: number;
  lastEventSequenceNumber: number;
};

type DynamoEventItem = {
  gameId: string;
  sequenceNumber: number;
  eventType: MultiplayerEvent['type'];
  createdAt: string;
  payload: MultiplayerEvent['payload'];
};

type DynamoConnectionItem = ConnectionRecord;

export function toGameItem(game: MultiplayerGame): DynamoGameItem {
  return {
    gameId: game.gameId,
    gameName: game.gameName,
    xPlayerName: game.xPlayerName,
    oPlayerName: game.oPlayerName,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    lastMoveAt: game.lastMoveAt,
    xPlayerId: game.xPlayerId,
    oPlayerId: game.oPlayerId,
    board: game.board,
    nextMark: game.nextMark,
    winner: game.winner,
    terminalReason: game.terminalReason,
    moveCount: game.moveCount,
    lastEventSequenceNumber: game.lastEventSequenceNumber,
  };
}

export function fromGameItem(item: DynamoGameItem | undefined): MultiplayerGame | null {
  if (!item) {
    return null;
  }

  return {
    gameId: item.gameId,
    gameName: item.gameName ?? `Game ${item.gameId}`,
    xPlayerName: item.xPlayerName ?? 'Player X',
    oPlayerName: item.oPlayerName ?? null,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    startedAt: item.startedAt,
    endedAt: item.endedAt,
    lastMoveAt: item.lastMoveAt,
    xPlayerId: item.xPlayerId,
    oPlayerId: item.oPlayerId,
    board: item.board,
    nextMark: item.nextMark,
    winner: item.winner,
    terminalReason: item.terminalReason,
    moveCount: item.moveCount,
    lastEventSequenceNumber: item.lastEventSequenceNumber,
    moves: [],
  };
}

export function toGameSummary(item: DynamoGameItem): GameSummary {
  return {
    gameId: item.gameId,
    gameName: item.gameName ?? `Game ${item.gameId}`,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    moveCount: item.moveCount,
    winner: item.winner,
    terminalReason: item.terminalReason,
  };
}

export function toEventItem(gameId: string, event: MultiplayerEvent): DynamoEventItem {
  return {
    gameId,
    sequenceNumber: event.sequenceNumber,
    eventType: event.type,
    createdAt: event.createdAt,
    payload: event.payload,
  };
}

export function fromEventItem(item: DynamoEventItem): MultiplayerEvent {
  return {
    sequenceNumber: item.sequenceNumber,
    type: item.eventType,
    createdAt: item.createdAt,
    payload: item.payload,
  };
}

export function toConnectionItem(record: ConnectionRecord): DynamoConnectionItem {
  return { ...record };
}

export function fromConnectionItem(item: DynamoConnectionItem): ConnectionRecord {
  return { ...item };
}
