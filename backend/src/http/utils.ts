import type { MultiplayerEvent, MultiplayerGame, MultiplayerMove, MultiplayerGameStatus } from '../domain/types.js';
import { MultiplayerDomainError, resolveAutomaticAbandonment } from '../domain/multiplayerGame.js';
import type { GameEventsRepository, GamesRepository } from '../repositories/types.js';
import { HttpHandlerError } from './errors.js';
import type { HttpRequest, HttpResponse } from './types.js';

const JSON_HEADERS = {
  'content-type': 'application/json',
};

export function createJsonResponse(statusCode: number, payload: unknown): HttpResponse {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  };
}

export function createErrorResponse(error: unknown): HttpResponse {
  if (error instanceof HttpHandlerError) {
    return createJsonResponse(error.statusCode, {
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof MultiplayerDomainError) {
    const statusCodeByCode: Record<MultiplayerDomainError['code'], number> = {
      invalid_move: 400,
      player_not_allowed: 403,
      game_not_joinable: 409,
      game_not_active: 409,
      not_your_turn: 409,
      already_over: 409,
    };

    return createJsonResponse(statusCodeByCode[error.code], {
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  return createJsonResponse(500, {
    error: {
      code: 'internal_error',
      message: 'An unexpected error occurred.',
    },
  });
}

export function parseJsonBody<T>(request: HttpRequest): T {
  if (!request.body) {
    return {} as T;
  }

  try {
    return JSON.parse(request.body) as T;
  } catch {
    throw new HttpHandlerError(400, 'invalid_json', 'Request body must be valid JSON.');
  }
}

export function requirePathParameter(
  request: HttpRequest,
  name: string,
): string {
  const value = request.pathParameters?.[name];

  if (!value) {
    throw new HttpHandlerError(400, 'missing_path_parameter', `Missing path parameter: ${name}.`);
  }

  return value;
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpHandlerError(400, 'invalid_request', `Field '${fieldName}' must be a non-empty string.`);
  }

  return value;
}

export function requireInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new HttpHandlerError(400, 'invalid_request', `Field '${fieldName}' must be an integer.`);
  }

  return value;
}

function eventToMove(event: MultiplayerEvent): MultiplayerMove | null {
  if (event.type !== 'move_accepted') {
    return null;
  }

  const payload = event.payload as { mark?: MultiplayerMove['mark']; position?: number; playerId?: string };

  if (
    (payload.mark !== 'X' && payload.mark !== 'O') ||
    typeof payload.position !== 'number' ||
    typeof payload.playerId !== 'string'
  ) {
    return null;
  }

  return {
    sequenceNumber: event.sequenceNumber,
    mark: payload.mark,
    position: payload.position,
    createdAt: event.createdAt,
    playerId: payload.playerId,
  };
}

export async function loadGameAggregate(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  gameId: string,
): Promise<{ game: MultiplayerGame; events: MultiplayerEvent[] }> {
  const [game, events] = await Promise.all([
    gamesRepository.getById(gameId),
    gameEventsRepository.listByGameId(gameId),
  ]);

  if (!game) {
    throw new HttpHandlerError(404, 'game_not_found', 'Game not found.');
  }

  const moves = events
    .map(eventToMove)
    .filter((move): move is MultiplayerMove => move !== null);

  return {
    game: {
      ...game,
      moves,
    },
    events,
  };
}

export async function persistGameAggregate(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  game: MultiplayerGame,
  events: MultiplayerEvent[],
): Promise<void> {
  await Promise.all([
    gamesRepository.save(game),
    gameEventsRepository.append(game.gameId, events),
  ]);
}

export async function autoAbandonGameIfNeeded(
  gamesRepository: GamesRepository,
  gameEventsRepository: GameEventsRepository,
  game: MultiplayerGame,
  events: MultiplayerEvent[],
  checkedAt: string,
  broadcastEvents?: (gameId: string, events: MultiplayerEvent[]) => Promise<void>,
): Promise<{ game: MultiplayerGame; events: MultiplayerEvent[]; abandoned: boolean }> {
  const result = resolveAutomaticAbandonment(game, { checkedAt });

  if (!result.abandoned) {
    return {
      game,
      events,
      abandoned: false,
    };
  }

  await persistGameAggregate(gamesRepository, gameEventsRepository, result.game, result.events);

  if (broadcastEvents) {
    await broadcastEvents(result.game.gameId, result.events);
  }

  return {
    game: result.game,
    events: [...events, ...result.events],
    abandoned: true,
  };
}

export function buildGameUrl(frontendBaseUrl: string | undefined, gameId: string): string | null {
  if (!frontendBaseUrl) {
    return null;
  }

  return `${frontendBaseUrl.replace(/\/$/, '')}/game/${gameId}`;
}

export function parseStatusFilter(request: HttpRequest): MultiplayerGameStatus {
  const status = request.queryStringParameters?.status;

  if (status === 'waiting' || status === 'active' || status === 'over') {
    return status;
  }

  throw new HttpHandlerError(
    400,
    'invalid_status',
    "Query parameter 'status' must be one of: waiting, active, over.",
  );
}

export function createHandler<TRequest extends HttpRequest>(
  handler: (request: TRequest) => Promise<HttpResponse>,
): (request: TRequest) => Promise<HttpResponse> {
  return async (request: TRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}
