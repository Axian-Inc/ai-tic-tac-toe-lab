import type { MultiplayerEvent, ParticipantType } from '../domain/types.js';

export interface WebSocketRequest {
  queryStringParameters?: Record<string, string | undefined> | null;
  requestContext: {
    connectionId: string;
    domainName?: string;
    stage?: string;
  };
}

export interface WebSocketResponse {
  statusCode: number;
  body: string;
}

export interface WebSocketHandlerDependencies {
  clock?: () => string;
  ttlEpochSeconds?: () => number;
}

export interface WebSocketPublisher {
  send(connectionId: string, payload: unknown): Promise<void>;
}

export interface BroadcastEventEnvelope {
  type: MultiplayerEvent['type'];
  gameId: string;
  sequenceNumber: number;
  createdAt: string;
  data: MultiplayerEvent['payload'];
}

export interface WebSocketConnectionContext {
  gameId: string;
  connectionId: string;
  participantType: ParticipantType;
  participantId: string;
  connectedAt: string;
  ttl?: number;
}
