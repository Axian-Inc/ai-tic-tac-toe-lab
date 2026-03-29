import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import type { MultiplayerEvent } from '../domain/types.js';
import type { ConnectionsRepository } from '../repositories/types.js';
import type { BroadcastEventEnvelope, WebSocketPublisher } from './types.js';

function toEnvelope(gameId: string, event: MultiplayerEvent): BroadcastEventEnvelope {
  return {
    type: event.type,
    gameId,
    sequenceNumber: event.sequenceNumber,
    createdAt: event.createdAt,
    data: event.payload,
  };
}

export class ApiGatewayWebSocketPublisher implements WebSocketPublisher {
  private readonly client: ApiGatewayManagementApiClient;

  constructor(endpoint: string) {
    this.client = new ApiGatewayManagementApiClient({ endpoint });
  }

  async send(connectionId: string, payload: unknown): Promise<void> {
    await this.client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      }),
    );
  }
}

export async function broadcastGameEvents(
  connectionsRepository: ConnectionsRepository,
  publisher: WebSocketPublisher,
  gameId: string,
  events: MultiplayerEvent[],
): Promise<void> {
  if (events.length === 0) {
    return;
  }

  const connections = await connectionsRepository.listByGameId(gameId);

  await Promise.all(
    connections.flatMap((connection) =>
      events.map(async (event) => {
        try {
          await publisher.send(connection.connectionId, toEnvelope(gameId, event));
        } catch (error) {
          if (error instanceof GoneException || (error as { name?: string }).name === 'GoneException') {
            await connectionsRepository.delete(connection.gameId, connection.connectionId);
            return;
          }

          throw error;
        }
      }),
    ),
  );
}
