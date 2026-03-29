import {
  checkForAbandonment,
  createMultiplayerGame,
  joinMultiplayerGame,
  resignGame,
  submitMove,
} from '../domain/multiplayerGame.js';
import type { MultiplayerEvent, MultiplayerGame } from '../domain/types.js';
import type { GameEventsRepository, GamesRepository } from '../repositories/types.js';
import { HttpHandlerError } from './errors.js';
import type { HandlerDependencies, HttpRequest } from './types.js';
import {
  autoAbandonGameIfNeeded,
  buildGameUrl,
  createHandler,
  createJsonResponse,
  loadGameAggregate,
  parseJsonBody,
  parseStatusFilter,
  persistGameAggregate,
  requireInteger,
  requirePathParameter,
  requireString,
} from './utils.js';

interface HttpHandlerContext extends Required<Pick<HandlerDependencies, 'clock' | 'createGameId' | 'createPlayerId' | 'createSpectatorId'>> {
  frontendBaseUrl?: string;
  broadcastEvents: NonNullable<HandlerDependencies['broadcastEvents']>;
  gamesRepository: GamesRepository;
  gameEventsRepository: GameEventsRepository;
}

interface IdBody {
  playerId?: unknown;
}

interface CreateGameBody {
  gameName?: unknown;
  playerName?: unknown;
}

interface MoveBody extends IdBody {
  square?: unknown;
}

interface JoinGameBody {
  playerName?: unknown;
}

function withDefaults(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
): HttpHandlerContext {
  return {
    gamesRepository,
    gameEventsRepository,
    frontendBaseUrl: dependencies.frontendBaseUrl,
    clock: dependencies.clock ?? (() => new Date().toISOString()),
    createGameId: dependencies.createGameId ?? (() => `g_${crypto.randomUUID()}`),
    createPlayerId: dependencies.createPlayerId ?? (() => `p_${crypto.randomUUID()}`),
    createSpectatorId: dependencies.createSpectatorId ?? (() => `s_${crypto.randomUUID()}`),
    broadcastEvents: dependencies.broadcastEvents ?? (async () => {}),
  };
}

function toGameSnapshot(game: MultiplayerGame) {
  return {
    gameId: game.gameId,
    gameName: game.gameName,
    xPlayerName: game.xPlayerName,
    oPlayerName: game.oPlayerName,
    status: game.status,
    board: game.board,
    nextMark: game.nextMark,
    moveCount: game.moveCount,
    winner: game.winner,
    terminalReason: game.terminalReason,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    lastMoveAt: game.lastMoveAt,
  };
}

function toEventPayload(event: MultiplayerEvent) {
  return {
    sequenceNumber: event.sequenceNumber,
    eventType: event.type,
    createdAt: event.createdAt,
    payload: event.payload,
  };
}

export function createPostGamesHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const body = parseJsonBody<CreateGameBody>(request);
    const nonTerminalCount = await context.gamesRepository.countByStatuses(['waiting', 'active']);

    if (nonTerminalCount >= 25) {
      throw new HttpHandlerError(429, 'game_capacity_reached', 'The multiplayer game limit has been reached.');
    }

    const createdAt = context.clock();
    const gameId = context.createGameId();
    const playerId = context.createPlayerId();
    const gameName =
      typeof body.gameName === 'string' && body.gameName.trim().length > 0
        ? body.gameName.trim()
        : `Game ${gameId}`;
    const playerName = requireString(body.playerName, 'playerName');
    const result = createMultiplayerGame({
      gameId,
      gameName,
      creatorPlayerId: playerId,
      creatorPlayerName: playerName,
      createdAt,
    });

    await persistGameAggregate(context.gamesRepository, context.gameEventsRepository, result.game, result.events);
    await context.broadcastEvents(result.game.gameId, result.events);

    return createJsonResponse(201, {
      game: toGameSnapshot(result.game),
      participant: {
        role: 'player',
        mark: 'X',
        playerId,
      },
      links: {
        gameUrl: buildGameUrl(context.frontendBaseUrl, gameId),
      },
    });
  });
}

export function createGetGameHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const gameId = requirePathParameter(request, 'id');
    const aggregate = await loadGameAggregate(context.gamesRepository, context.gameEventsRepository, gameId);
    const resolvedAggregate = await autoAbandonGameIfNeeded(
      context.gamesRepository,
      context.gameEventsRepository,
      aggregate.game,
      aggregate.events,
      context.clock(),
      context.broadcastEvents,
    );

    return createJsonResponse(200, {
      game: toGameSnapshot(resolvedAggregate.game),
      players: {
        X: { joined: true },
        O: { joined: resolvedAggregate.game.oPlayerId !== null },
      },
      events: resolvedAggregate.events.map(toEventPayload),
    });
  });
}

export function createListGamesHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const status = parseStatusFilter(request);
    const activeGames = await context.gamesRepository.listByStatus('active');

    for (const activeGame of activeGames) {
      const aggregate = await loadGameAggregate(
        context.gamesRepository,
        context.gameEventsRepository,
        activeGame.gameId,
      );
      await autoAbandonGameIfNeeded(
        context.gamesRepository,
        context.gameEventsRepository,
        aggregate.game,
        aggregate.events,
        context.clock(),
        context.broadcastEvents,
      );
    }

    const games = await context.gamesRepository.listByStatus(status);

    return createJsonResponse(200, { games });
  });
}

export function createJoinGameHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const gameId = requirePathParameter(request, 'id');
    const body = parseJsonBody<JoinGameBody>(request);
    const aggregate = await loadGameAggregate(context.gamesRepository, context.gameEventsRepository, gameId);
    const playerId = context.createPlayerId();
    const joinedAt = context.clock();
    const result = joinMultiplayerGame(aggregate.game, {
      playerId,
      playerName: requireString(body.playerName, 'playerName'),
      joinedAt,
    });

    await persistGameAggregate(context.gamesRepository, context.gameEventsRepository, result.game, result.events);
    await context.broadcastEvents(result.game.gameId, result.events);

    return createJsonResponse(200, {
      game: {
        gameId: result.game.gameId,
        gameName: result.game.gameName,
        xPlayerName: result.game.xPlayerName,
        oPlayerName: result.game.oPlayerName,
        status: result.game.status,
        nextMark: result.game.nextMark,
      },
      participant: {
        role: 'player',
        mark: 'O',
        playerId,
      },
      links: {
        gameUrl: buildGameUrl(context.frontendBaseUrl, gameId),
      },
    });
  });
}

export function createPostMoveHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const gameId = requirePathParameter(request, 'id');
    const body = parseJsonBody<MoveBody>(request);
    const playerId = requireString(body.playerId, 'playerId');
    const square = requireInteger(body.square, 'square');
    const aggregate = await loadGameAggregate(context.gamesRepository, context.gameEventsRepository, gameId);
    const resolvedAggregate = await autoAbandonGameIfNeeded(
      context.gamesRepository,
      context.gameEventsRepository,
      aggregate.game,
      aggregate.events,
      context.clock(),
      context.broadcastEvents,
    );
    const result = submitMove(resolvedAggregate.game, {
      playerId,
      position: square,
      createdAt: context.clock(),
    });

    await persistGameAggregate(context.gamesRepository, context.gameEventsRepository, result.game, result.events);
    await context.broadcastEvents(result.game.gameId, result.events);

    return createJsonResponse(200, {
      game: toGameSnapshot(result.game),
      event: toEventPayload(result.events[0]),
    });
  });
}

export function createResignGameHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const gameId = requirePathParameter(request, 'id');
    const body = parseJsonBody<IdBody>(request);
    const playerId = requireString(body.playerId, 'playerId');
    const aggregate = await loadGameAggregate(context.gamesRepository, context.gameEventsRepository, gameId);
    const resolvedAggregate = await autoAbandonGameIfNeeded(
      context.gamesRepository,
      context.gameEventsRepository,
      aggregate.game,
      aggregate.events,
      context.clock(),
      context.broadcastEvents,
    );
    const result = resignGame(resolvedAggregate.game, {
      playerId,
      createdAt: context.clock(),
    });

    await persistGameAggregate(context.gamesRepository, context.gameEventsRepository, result.game, result.events);
    await context.broadcastEvents(result.game.gameId, result.events);

    return createJsonResponse(200, {
      game: toGameSnapshot(result.game),
    });
  });
}

export function createSpectateGameHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const gameId = requirePathParameter(request, 'id');
    const aggregate = await loadGameAggregate(context.gamesRepository, context.gameEventsRepository, gameId);
    const resolvedAggregate = await autoAbandonGameIfNeeded(
      context.gamesRepository,
      context.gameEventsRepository,
      aggregate.game,
      aggregate.events,
      context.clock(),
      context.broadcastEvents,
    );
    const spectatorId = context.createSpectatorId();

    return createJsonResponse(200, {
      spectator: {
        spectatorId,
      },
      game: {
        gameId: resolvedAggregate.game.gameId,
        gameName: resolvedAggregate.game.gameName,
        status: resolvedAggregate.game.status,
      },
      websocket: {
        gameId: resolvedAggregate.game.gameId,
      },
    });
  });
}

export function createAbandonmentCheckHandler(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  dependencies: HandlerDependencies = {},
) {
  const context = withDefaults(gamesRepository, gameEventsRepository, dependencies);

  return createHandler(async (request: HttpRequest) => {
    const gameId = requirePathParameter(request, 'id');
    const body = parseJsonBody<IdBody>(request);
    const playerId = requireString(body.playerId, 'playerId');
    const aggregate = await loadGameAggregate(context.gamesRepository, context.gameEventsRepository, gameId);
    const resolvedAggregate = await autoAbandonGameIfNeeded(
      context.gamesRepository,
      context.gameEventsRepository,
      aggregate.game,
      aggregate.events,
      context.clock(),
      context.broadcastEvents,
    );
    if (resolvedAggregate.abandoned) {
      return createJsonResponse(200, {
        abandonmentChecked: true,
        game: toGameSnapshot(resolvedAggregate.game),
      });
    }
    const result = checkForAbandonment(resolvedAggregate.game, {
      playerId,
      checkedAt: context.clock(),
    });

    if (result.abandoned) {
      await persistGameAggregate(context.gamesRepository, context.gameEventsRepository, result.game, result.events);
      await context.broadcastEvents(result.game.gameId, result.events);
    }

    return createJsonResponse(200, {
      abandonmentChecked: true,
      game: toGameSnapshot(result.game),
      ...(result.abandoned ? {} : { result: 'not_abandoned' }),
    });
  });
}
