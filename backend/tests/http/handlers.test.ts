import { describe, expect, it } from 'vitest';
import type { MultiplayerEvent, MultiplayerGame, MultiplayerGameStatus } from '../../src/domain/types.js';
import {
  createAbandonmentCheckHandler,
  createGetGameHandler,
  createJoinGameHandler,
  createListGamesHandler,
  createPostGamesHandler,
  createPostMoveHandler,
  createResignGameHandler,
  createSpectateGameHandler,
} from '../../src/http/handlers.js';
import type { GameEventsRepository, GamesRepository, GameSummary } from '../../src/repositories/types.js';

class InMemoryGamesRepository implements GamesRepository {
  private readonly games = new Map<string, MultiplayerGame>();

  async save(game: MultiplayerGame): Promise<void> {
    this.games.set(game.gameId, {
      ...game,
      board: [...game.board] as MultiplayerGame['board'],
      moves: game.moves.map((move) => ({ ...move })),
    });
  }

  async getById(gameId: string): Promise<MultiplayerGame | null> {
    const game = this.games.get(gameId);
    return game ? { ...game, board: [...game.board] as MultiplayerGame['board'], moves: game.moves.map((move) => ({ ...move })) } : null;
  }

  async listByStatus(status: MultiplayerGameStatus): Promise<GameSummary[]> {
    return [...this.games.values()]
      .filter((game) => game.status === status)
      .map((game) => ({
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

function parseBody(response: Awaited<ReturnType<ReturnType<typeof createPostGamesHandler>>>) {
  return JSON.parse(response.body) as Record<string, unknown>;
}

function createDependencies() {
  return {
    frontendBaseUrl: 'https://app.example.com',
    clock: () => '2026-03-21T20:00:00.000Z',
    createGameId: () => 'g_123',
    createPlayerId: (() => {
      let index = 0;
      const ids = ['p_x_123', 'p_o_123'];
      return () => ids[index++] ?? `p_extra_${index}`;
    })(),
    createSpectatorId: () => 's_123',
  };
}

async function seedActiveGame(
  gamesRepository: InMemoryGamesRepository,
  gameEventsRepository: InMemoryGameEventsRepository,
) {
  const dependencies = createDependencies();
  const createHandler = createPostGamesHandler(gamesRepository, gameEventsRepository, dependencies);
  const joinHandler = createJoinGameHandler(gamesRepository, gameEventsRepository, dependencies);

  await createHandler({
    body: JSON.stringify({
      playerName: 'Major Mischief',
    }),
  });
  await joinHandler({
    pathParameters: { id: 'g_123' },
    body: JSON.stringify({
      playerName: 'Captain Curious',
    }),
  });
}

describe('HTTP handlers', () => {
  it('creates a game and returns the participant plus deep link', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    const handler = createPostGamesHandler(gamesRepository, gameEventsRepository, createDependencies());

    const response = await handler({
      body: JSON.stringify({
        playerName: 'Major Mischief',
      }),
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(201);
    expect((body.game as { gameName: string }).gameName).toBe('Game g_123');
    expect((body.game as { xPlayerName: string }).xPlayerName).toBe('Major Mischief');
    expect(body.participant).toEqual({
      role: 'player',
      mark: 'X',
      playerId: 'p_x_123',
    });
    expect(body.links).toEqual({
      gameUrl: 'https://app.example.com/game/g_123',
    });
  });

  it('uses the provided game name when creating a game', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    const handler = createPostGamesHandler(gamesRepository, gameEventsRepository, createDependencies());

    const response = await handler({
      body: JSON.stringify({
        gameName: 'Falcon Denver',
        playerName: 'Major Mischief',
      }),
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(201);
    expect((body.game as { gameName: string }).gameName).toBe('Falcon Denver');
  });

  it('returns 429 when the game capacity is reached', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();

    for (let index = 0; index < 25; index += 1) {
      await gamesRepository.save({
        gameId: `game-${index}`,
        gameName: `Game ${index}`,
        xPlayerName: `Player ${index}`,
        oPlayerName: null,
        status: 'waiting',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        startedAt: null,
        endedAt: null,
        lastMoveAt: null,
        xPlayerId: `player-${index}`,
        oPlayerId: null,
        board: [null, null, null, null, null, null, null, null, null],
        nextMark: 'X',
        winner: null,
        terminalReason: null,
        moveCount: 0,
        lastEventSequenceNumber: 1,
        moves: [],
      });
    }

    const handler = createPostGamesHandler(gamesRepository, gameEventsRepository, createDependencies());
    const response = await handler({});
    const body = parseBody(response);

    expect(response.statusCode).toBe(429);
    expect(body.error).toEqual({
      code: 'game_capacity_reached',
      message: 'The multiplayer game limit has been reached.',
    });
  });

  it('gets a game snapshot and replay history', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const handler = createGetGameHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T20:01:00.000Z',
    });

    const response = await handler({
      pathParameters: { id: 'g_123' },
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect((body.game as { gameName: string }).gameName).toBe('Game g_123');
    expect((body.game as { xPlayerName: string }).xPlayerName).toBe('Major Mischief');
    expect((body.events as unknown[])).toHaveLength(2);
    expect(body.players).toEqual({
      X: { joined: true },
      O: { joined: true },
    });
  });

  it('lists games by status', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await gamesRepository.save({
      gameId: 'g_123',
      gameName: 'Pelican Portland',
      xPlayerName: 'Major Mischief',
      oPlayerName: null,
      status: 'waiting',
      createdAt: '2026-03-21T18:00:00.000Z',
      updatedAt: '2026-03-21T18:00:00.000Z',
      startedAt: null,
      endedAt: null,
      lastMoveAt: null,
      xPlayerId: 'p_x_123',
      oPlayerId: null,
      board: [null, null, null, null, null, null, null, null, null],
      nextMark: 'X',
      winner: null,
      terminalReason: null,
      moveCount: 0,
      lastEventSequenceNumber: 1,
        moves: [],
    });
    const handler = createListGamesHandler(gamesRepository, gameEventsRepository);

    const response = await handler({
      queryStringParameters: { status: 'waiting' },
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect((body.games as unknown[])).toHaveLength(1);
    expect((body.games as Array<{ gameName: string }>)[0]?.gameName).toBe('Pelican Portland');
  });

  it('auto-abandons stale active games during reads and returns the terminal snapshot', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    const broadcastEvents = [] as MultiplayerEvent[][];
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const moveHandler = createPostMoveHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T18:00:45.000Z',
    });

    await moveHandler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerId: 'p_x_123',
        square: 0,
      }),
    });

    const handler = createGetGameHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T18:04:00.000Z',
      broadcastEvents: async (_gameId, events) => {
        broadcastEvents.push(events);
      },
    });

    const response = await handler({
      pathParameters: { id: 'g_123' },
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect((body.game as { gameName: string }).gameName).toBe('Game g_123');
    expect((body.game as { status: string }).status).toBe('over');
    expect((body.game as { terminalReason: string }).terminalReason).toBe('abandonment');
    expect((body.game as { winner: string }).winner).toBe('X');
    expect(broadcastEvents).toHaveLength(1);
    expect(broadcastEvents[0]?.map((event) => event.type)).toEqual(['abandonment_checked', 'game_over']);
  });

  it('moves stale active games into over listings automatically', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const moveHandler = createPostMoveHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T18:00:45.000Z',
    });

    await moveHandler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerId: 'p_x_123',
        square: 0,
      }),
    });

    const activeHandler = createListGamesHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T18:04:00.000Z',
    });
    const activeResponse = await activeHandler({
      queryStringParameters: { status: 'active' },
    });
    const activeBody = parseBody(activeResponse);

    const overHandler = createListGamesHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T18:04:00.000Z',
    });
    const overResponse = await overHandler({
      queryStringParameters: { status: 'over' },
    });
    const overBody = parseBody(overResponse);

    expect((activeBody.games as unknown[])).toHaveLength(0);
    expect((overBody.games as Array<{ gameId: string; terminalReason: string }>)).toEqual([
      expect.objectContaining({
        gameId: 'g_123',
        terminalReason: 'abandonment',
      }),
    ]);
  });

  it('joins a waiting game', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    const dependencies = createDependencies();
    const createHandler = createPostGamesHandler(gamesRepository, gameEventsRepository, dependencies);
    const joinHandler = createJoinGameHandler(gamesRepository, gameEventsRepository, dependencies);

    await createHandler({
      body: JSON.stringify({
        playerName: 'Major Mischief',
      }),
    });
    const response = await joinHandler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerName: 'Captain Curious',
      }),
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect((body.game as { gameName: string }).gameName).toBe('Game g_123');
    expect((body.game as { oPlayerName: string }).oPlayerName).toBe('Captain Curious');
    expect(body.participant).toEqual({
      role: 'player',
      mark: 'O',
      playerId: 'p_o_123',
    });
  });

  it('submits a move and returns the accepted move event', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const handler = createPostMoveHandler(gamesRepository, gameEventsRepository, createDependencies());

    const response = await handler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerId: 'p_x_123',
        square: 0,
      }),
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body.event).toEqual({
      sequenceNumber: 3,
      eventType: 'move_accepted',
      createdAt: '2026-03-21T20:00:00.000Z',
      payload: {
        mark: 'X',
        position: 0,
        playerId: 'p_x_123',
        status: 'active',
        winner: null,
        terminalReason: null,
      },
    });
  });

  it('resigns an active game', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const handler = createResignGameHandler(gamesRepository, gameEventsRepository, createDependencies());

    const response = await handler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerId: 'p_x_123',
      }),
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect((body.game as { terminalReason: string }).terminalReason).toBe('resignation');
  });

  it('returns a spectator token for spectate', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const handler = createSpectateGameHandler(gamesRepository, gameEventsRepository, createDependencies());

    const response = await handler({
      pathParameters: { id: 'g_123' },
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body.spectator).toEqual({
      spectatorId: 's_123',
    });
    expect((body.game as { gameName: string }).gameName).toBe('Game g_123');
  });

  it('returns not_abandoned when the timeout has not elapsed', async () => {
    const gamesRepository = new InMemoryGamesRepository();
    const gameEventsRepository = new InMemoryGameEventsRepository();
    await seedActiveGame(gamesRepository, gameEventsRepository);
    const handler = createAbandonmentCheckHandler(gamesRepository, gameEventsRepository, {
      ...createDependencies(),
      clock: () => '2026-03-21T18:01:00.000Z',
    });

    const response = await handler({
      pathParameters: { id: 'g_123' },
      body: JSON.stringify({
        playerId: 'p_x_123',
      }),
    });
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body.result).toBe('not_abandoned');
  });
});
