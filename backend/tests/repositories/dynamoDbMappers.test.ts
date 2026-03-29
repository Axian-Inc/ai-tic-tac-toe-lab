import { describe, expect, it } from 'vitest';
import {
  fromConnectionItem,
  fromEventItem,
  fromGameItem,
  toConnectionItem,
  toEventItem,
  toGameItem,
} from '../../src/repositories/dynamoDbMappers.js';
import type { MultiplayerEvent, MultiplayerGame } from '../../src/domain/types.js';

function createGame(): MultiplayerGame {
  return {
    gameId: 'game-1',
    gameName: 'Otter Austin',
    xPlayerName: 'Major Mischief',
    oPlayerName: 'Captain Curious',
    status: 'active',
    createdAt: '2026-03-21T18:00:00.000Z',
    updatedAt: '2026-03-21T18:01:00.000Z',
    startedAt: '2026-03-21T18:00:30.000Z',
    endedAt: null,
    lastMoveAt: '2026-03-21T18:01:00.000Z',
    xPlayerId: 'player-x',
    oPlayerId: 'player-o',
    board: ['X', null, null, null, 'O', null, null, null, null],
    nextMark: 'X',
    winner: null,
    terminalReason: null,
    moveCount: 2,
    lastEventSequenceNumber: 3,
    moves: [],
  };
}

describe('dynamoDbMappers', () => {
  it('maps games to a DynamoDB item and back', () => {
    const game = createGame();
    const item = toGameItem(game);
    const restored = fromGameItem(item);

    expect(restored).toEqual({
      ...game,
      moves: [],
    });
  });

  it('maps events to a DynamoDB item and back', () => {
    const event: MultiplayerEvent<{ mark: string; position: number }> = {
      sequenceNumber: 3,
      type: 'move_accepted',
      createdAt: '2026-03-21T18:01:00.000Z',
      payload: {
        mark: 'X',
        position: 0,
      },
    };

    const item = toEventItem('game-1', event);

    expect(fromEventItem(item)).toEqual(event);
  });

  it('maps connection records to DynamoDB items and back', () => {
    const record = {
      gameId: 'game-1',
      connectionId: 'connection-1',
      participantType: 'player' as const,
      participantId: 'player-x',
      connectedAt: '2026-03-21T18:01:00.000Z',
      ttl: 1770000000,
    };

    expect(fromConnectionItem(toConnectionItem(record))).toEqual(record);
  });
});
