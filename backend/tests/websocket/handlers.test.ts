import { GoneException } from '@aws-sdk/client-apigatewaymanagementapi';
import { describe, expect, it } from 'vitest';
import { createPostMoveHandler } from '../../src/http/handlers.js';
import { broadcastGameEvents } from '../../src/websocket/broadcaster.js';
import {
  createWebSocketConnectHandler,
  createWebSocketDefaultHandler,
  createWebSocketDisconnectHandler,
} from '../../src/websocket/handlers.js';
import type { WebSocketPublisher } from '../../src/websocket/types.js';
import type { ConnectionRecord, ConnectionsRepository, GameEventsRepository, GamesRepository, GameSummary } from '../../src/repositories/types.js';
import type { MultiplayerEvent, MultiplayerGame, MultiplayerGameStatus } from '../../src/domain/types.js';
import { createPostGamesHandler, createJoinGameHandler } from '../../src/http/handlers.js';

class InMemoryConnectionsRepository implements ConnectionsRepository {
  private readonly records = new Map<string, ConnectionRecord>();

  async put(record: ConnectionRecord): Promise<void> {
    this.records.set(`${record.gameId}:${record.connectionId}`, { ...record });
  }

  async delete(gameId: string, connectionId: string): Promise<void> {
    this.records.delete(`${gameId}:${connectionId}`);
  }

  async listByGameId(gameId: string): Promise<ConnectionRecord[]> {
    return [...this.records.values()].filter((record) => record.gameId === gameId);
  }

  async findByConnectionId(connectionId: string): Promise<ConnectionRecord | null> {
    return [...this.records.values()].find((record) => record.connectionId === connectionId) ?? null;
  }
}

class InMemoryGamesRepository implements GamesRepository {
  private readonly games = new Map<string, MultiplayerGame>();

  async save(game: MultiplayerGame): Promise<void> {
    this.games.set(game.gameId, { ...game, board: [...game.board] as MultiplayerGame['board'], moves: game.moves.map((move) => ({ ...move })) });
  }

  async getById(gameId: string): Promise<MultiplayerGame | null> {
    const game = this.games.get(gameId);
    return game ? { ...game, board: [...game.board] as MultiplayerGame['board'], moves: game.moves.map((move) => ({ ...move })) } : null;
  }

  async listByStatus(status: MultiplayerGameStatus): Promise<GameSummary[]> {
    return [...this.games.values()].filter((game) => game.status === status).map((game) => ({
      gameId: game.gameId,
      gameName: game.gameName,
      status: game.status,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      moveCount: game.moveCount,
      winner: game.winner,
      terminalReason: game.terminalReason,
    }));
  }

  async countByStatuses(statuses: MultiplayerGameStatus[]): Promise<number> {
    return [...this.games.values()].filter((game) => statuses.includes(game.status)).length;
  }
}

class InMemoryGameEventsRepository implements GameEventsRepository {
  private readonly events = new Map<string, MultiplayerEvent[]>();

  async append(gameId: string, events: MultiplayerEvent[]): Promise<void> {
    const existing = this.events.get(gameId) ?? [];
    this.events.set(gameId, [...existing, ...events.map((event) => ({ ...event }))]);
  }

  async listByGameId(gameId: string): Promise<MultiplayerEvent[]> {
    return (this.events.get(gameId) ?? []).map((event) => ({ ...event }));
  }
}

class MockPublisher implements WebSocketPublisher {
  public readonly sent: Array<{ connectionId: string; payload: unknown }> = [];

  constructor(private readonly staleConnectionIds = new Set<string>()) {}

  async send(connectionId: string, payload: unknown): Promise<void> {
    if (this.staleConnectionIds.has(connectionId)) {
      throw new GoneException({
        message: 'gone',
        $metadata: {},
      });
    }

    this.sent.push({ connectionId, payload });
  }
}

function createDependencies() {
  return {
    clock: () => '2026-03-21T20:00:00.000Z',
    createGameId: () => 'g_123',
    createPlayerId: (() => {
      let index = 0;
      const ids = ['p_x_123', 'p_o_123'];
      return () => ids[index++] ?? `p_extra_${index}`;
    })(),
  };
}

async function seedActiveGame(
  gamesRepository: InMemoryGamesRepository,
  gameEventsRepository: InMemoryGameEventsRepository,
) {
  const dependencies = createDependencies();
  await createPostGamesHandler(gamesRepository, gameEventsRepository, dependencies)({
    body: JSON.stringify({
      playerName: 'Major Mischief',
    }),
  });
  await createJoinGameHandler(gamesRepository, gameEventsRepository, dependencies)({
    pathParameters: { id: 'g_123' },
    body: JSON.stringify({
      playerName: 'Captain Curious',
    }),
  });
}

describe('websocket handlers and broadcaster', () => {
  it('stores a websocket connection on connect', async () => {
    const repository = new InMemoryConnectionsRepository();
    const handler = createWebSocketConnectHandler(repository, {
      clock: () => '2026-03-21T20:00:00.000Z',
      ttlEpochSeconds: () => 1770000000,
    });

    const response = await handler({
      queryStringParameters: {
        gameId: 'g_123',
        participantType: 'player',
        participantId: 'p_x_123',
      },
      requestContext: {
        connectionId: 'connection-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(await repository.findByConnectionId('connection-1')).toEqual({
      gameId: 'g_123',
      connectionId: 'connection-1',
      participantType: 'player',
      participantId: 'p_x_123',
      connectedAt: '2026-03-21T20:00:00.000Z',
      ttl: 1770000000,
    });
  });

  it('removes a websocket connection on disconnect', async () => {
    const repository = new InMemoryConnectionsRepository();
    await repository.put({
      gameId: 'g_123',
      connectionId: 'connection-1',
      participantType: 'player',
      participantId: 'p_x_123',
      connectedAt: '2026-03-21T20:00:00.000Z',
    });
    const handler = createWebSocketDisconnectHandler(repository);

    const response = await handler({
      requestContext: {
        connectionId: 'connection-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(await repository.findByConnectionId('connection-1')).toBeNull();
  });

  it('accepts default websocket route requests', async () => {
    const handler = createWebSocketDefaultHandler();
    const response = await handler({
      requestContext: {
        connectionId: 'connection-1',
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('broadcasts events to all subscribers and removes stale connections', async () => {
    const repository = new InMemoryConnectionsRepository();
    await repository.put({
      gameId: 'g_123',
      connectionId: 'connection-1',
      participantType: 'player',
      participantId: 'p_x_123',
      connectedAt: '2026-03-21T20:00:00.000Z',
    });
    await repository.put({
      gameId: 'g_123',
      connectionId: 'connection-2',
      participantType: 'spectator',
      participantId: 's_123',
      connectedAt: '2026-03-21T20:00:00.000Z',
    });
    const publisher = new MockPublisher(new Set(['connection-2']));

    await broadcastGameEvents(repository, publisher, 'g_123', [
      {
        sequenceNumber: 3,
        type: 'move_accepted',
        createdAt: '2026-03-21T20:00:00.000Z',
        payload: {
          mark: 'X',
          position: 0,
        },
      },
    ]);

    expect(publisher.sent).toHaveLength(1);
    expect(await repository.findByConnectionId('connection-2')).toBeNull();
  });

  it('broadcasts move events from mutating HTTP handlers', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    const connectionsRepository = new InMemoryConnectionsRepository();
    const publisher = new MockPublisher();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    await connectionsRepository.put({
      gameId: 'g_123',
      connectionId: 'connection-1',
      participantType: 'player',
      participantId: 'p_x_123',
      connectedAt: '2026-03-21T20:00:00.000Z',
    });
    const handler = createPostMoveHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      broadcastEvents: (gameId, events) =>
        broadcastGameEvents(connectionsRepository, publisher, gameId, events),
    });

    const response = await handler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerId: 'p_x_123',
        square: 0,
      }),
    });

    expect(response.statusCode).toBe(200);
    expect(publisher.sent).toHaveLength(1);
    expect(publisher.sent[0]?.payload).toEqual({
      type: 'move_accepted',
      gameId: 'g_123',
      sequenceNumber: 3,
      createdAt: '2026-03-21T20:00:00.000Z',
      data: {
        mark: 'X',
        position: 0,
        playerId: 'p_x_123',
        status: 'active',
        winner: null,
        terminalReason: null,
      },
    });
  });
});
