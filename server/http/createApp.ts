import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { type ListGamesRequest, type MultiplayerGameStatus } from '../../shared/contracts';
import { HttpError, MultiplayerService } from '../multiplayer/service';

export function createApp(service: MultiplayerService) {
  return createServer(async (request, response) => {
    try {
      await routeRequest(request, response, service);
    } catch (error) {
      respondWithError(response, error);
    }
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  service: MultiplayerService,
) {
  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (method === 'POST' && url.pathname === '/games') {
    return writeJson(response, 201, service.createGame());
  }

  if (method === 'GET' && url.pathname === '/games') {
    const status = url.searchParams.get('status') ?? undefined;

    if (status && status !== 'waiting' && status !== 'active' && status !== 'over') {
      throw new HttpError(400, 'status must be waiting, active, or over.');
    }

    const requestFilter: ListGamesRequest = status ? { status: status as MultiplayerGameStatus } : {};
    return writeJson(response, 200, service.listGames(requestFilter));
  }

  const gameDetailsMatch = url.pathname.match(/^\/games\/([^/]+)$/);
  if (method === 'GET' && gameDetailsMatch) {
    const [, gameId] = gameDetailsMatch;
    return writeJson(response, 200, {
      game: service.getGame(gameId),
    });
  }

  const match = url.pathname.match(/^\/games\/([^/]+)\/(join|moves|resign|abandonment-check)$/);
  if (!match) {
    throw new HttpError(404, 'Route not found.');
  }

  const [, gameId, action] = match;
  const body = await readJsonBody(request);

  if (method !== 'POST') {
    throw new HttpError(405, 'Only POST is supported for this route.');
  }

  switch (action) {
    case 'join':
      return writeJson(response, 200, service.joinGame(gameId));
    case 'moves':
      return writeJson(response, 200, service.submitMove(gameId, body));
    case 'resign':
      return writeJson(response, 200, service.resignGame(gameId, body));
    case 'abandonment-check':
      return writeJson(response, 200, service.checkAbandonment(gameId, body));
    default:
      throw new HttpError(404, 'Route not found.');
  }
}

async function readJsonBody(request: IncomingMessage): Promise<any> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function respondWithError(response: ServerResponse, error: unknown) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error.';

  writeJson(response, statusCode, {
    error: message,
  });
}
