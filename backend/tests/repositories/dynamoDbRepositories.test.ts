import { BatchWriteCommand, DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';
import type { MultiplayerEvent, MultiplayerGame } from '../../src/domain/types.js';
import {
  DynamoDbConnectionsRepository,
  DynamoDbGameEventsRepository,
  DynamoDbGamesRepository,
} from '../../src/repositories/dynamoDbRepositories.js';
import type { BackendTableNames } from '../../src/repositories/types.js';

class MockDocumentClient {
  public readonly calls: unknown[] = [];

  constructor(private readonly responses: unknown[] = []) {}

  async send(command: unknown): Promise<unknown> {
    this.calls.push(command);
    return this.responses.shift() ?? {};
  }
}

const tableNames: BackendTableNames = {
  gamesTableName: 'games',
  gameEventsTableName: 'game_events',
  connectionsTableName: 'connections',
};

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

describe('DynamoDbGamesRepository', () => {
  it('saves and reads games', async () => {
    const client = new MockDocumentClient([{}, { Item: { ...createGame() } }]);
    const repository = new DynamoDbGamesRepository(client as never, tableNames);

    await repository.save(createGame());
    const game = await repository.getById('game-1');

    expect(client.calls[0]).toBeInstanceOf(PutCommand);
    expect(client.calls[1]).toBeInstanceOf(GetCommand);
    expect(game?.gameId).toBe('game-1');
  });

  it('lists and counts games by status', async () => {
    const client = new MockDocumentClient([
      { Items: [{ ...createGame(), status: 'waiting', gameId: 'game-1' }] },
      { Items: [{ ...createGame(), status: 'waiting', gameId: 'game-1' }] },
      { Items: [{ ...createGame(), status: 'active', gameId: 'game-2' }] },
    ]);
    const repository = new DynamoDbGamesRepository(client as never, tableNames);

    const waiting = await repository.listByStatus('waiting');
    const count = await repository.countByStatuses(['waiting', 'active']);

    expect(client.calls[0]).toBeInstanceOf(QueryCommand);
    expect(waiting).toHaveLength(1);
    expect(count).toBe(2);
  });
});

describe('DynamoDbGameEventsRepository', () => {
  it('appends and lists ordered events', async () => {
    const events: MultiplayerEvent[] = [
      {
        sequenceNumber: 1,
        type: 'game_created',
        createdAt: '2026-03-21T18:00:00.000Z',
        payload: {},
      },
    ];
    const client = new MockDocumentClient([
      {},
      {
        Items: [
          {
            gameId: 'game-1',
            sequenceNumber: 1,
            eventType: 'game_created',
            createdAt: '2026-03-21T18:00:00.000Z',
            payload: {},
          },
        ],
      },
    ]);
    const repository = new DynamoDbGameEventsRepository(client as never, tableNames);

    await repository.append('game-1', events);
    const listed = await repository.listByGameId('game-1');

    expect(client.calls[0]).toBeInstanceOf(BatchWriteCommand);
    expect(client.calls[1]).toBeInstanceOf(QueryCommand);
    expect(listed).toEqual(events);
  });
});

describe('DynamoDbConnectionsRepository', () => {
  it('stores, lists, and deletes connection records', async () => {
    const client = new MockDocumentClient([
      {},
      {
        Items: [
          {
            gameId: 'game-1',
            connectionId: 'connection-1',
            participantType: 'player',
            participantId: 'player-x',
            connectedAt: '2026-03-21T18:01:00.000Z',
          },
        ],
      },
      {
        Items: [
          {
            gameId: 'game-1',
            connectionId: 'connection-1',
            participantType: 'player',
            participantId: 'player-x',
            connectedAt: '2026-03-21T18:01:00.000Z',
          },
        ],
      },
      {},
    ]);
    const repository = new DynamoDbConnectionsRepository(client as never, tableNames);

    await repository.put({
      gameId: 'game-1',
      connectionId: 'connection-1',
      participantType: 'player',
      participantId: 'player-x',
      connectedAt: '2026-03-21T18:01:00.000Z',
    });
    const records = await repository.listByGameId('game-1');
    const record = await repository.findByConnectionId('connection-1');
    await repository.delete('game-1', 'connection-1');

    expect(client.calls[0]).toBeInstanceOf(PutCommand);
    expect(client.calls[1]).toBeInstanceOf(QueryCommand);
    expect(client.calls[2]).toBeInstanceOf(ScanCommand);
    expect(client.calls[3]).toBeInstanceOf(DeleteCommand);
    expect(records).toHaveLength(1);
    expect(record?.connectionId).toBe('connection-1');
  });
});
