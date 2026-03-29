import type { ConnectionsRepository } from '../repositories/types.js';
import type { WebSocketHandlerDependencies, WebSocketRequest } from './types.js';
import { createWebSocketHandler, createWebSocketResponse, requireWebSocketQueryParam } from './utils.js';

function withDefaults(dependencies: WebSocketHandlerDependencies = {}) {
  return {
    clock: dependencies.clock ?? (() => new Date().toISOString()),
    ttlEpochSeconds:
      dependencies.ttlEpochSeconds ??
      (() => Math.floor(Date.now() / 1000) + 24 * 60 * 60),
  };
}

export function createWebSocketConnectHandler(
  connectionsRepository: ConnectionsRepository,
  dependencies: WebSocketHandlerDependencies = {},
) {
  const context = withDefaults(dependencies);

  return createWebSocketHandler(async (request: WebSocketRequest) => {
    const gameId = requireWebSocketQueryParam(request, 'gameId');
    const participantType =
      request.queryStringParameters?.participantType === 'player' ? 'player' : 'spectator';
    const participantId = request.queryStringParameters?.participantId ?? 'anonymous';

    await connectionsRepository.put({
      gameId,
      connectionId: request.requestContext.connectionId,
      participantType,
      participantId,
      connectedAt: context.clock(),
      ttl: context.ttlEpochSeconds(),
    });

    return createWebSocketResponse(200, '');
  });
}

export function createWebSocketDisconnectHandler(
  connectionsRepository: ConnectionsRepository,
) {
  return createWebSocketHandler(async (request: WebSocketRequest) => {
    const record = await connectionsRepository.findByConnectionId(request.requestContext.connectionId);

    if (record) {
      await connectionsRepository.delete(record.gameId, record.connectionId);
    }

    return createWebSocketResponse(200, '');
  });
}

export function createWebSocketDefaultHandler() {
  return createWebSocketHandler(async () => createWebSocketResponse(200, ''));
}
