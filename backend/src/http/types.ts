export interface HttpRequest {
  body?: string | null;
  pathParameters?: Record<string, string | undefined> | null;
  queryStringParameters?: Record<string, string | undefined> | null;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface HandlerDependencies {
  frontendBaseUrl?: string;
  clock?: () => string;
  createGameId?: () => string;
  createPlayerId?: () => string;
  createSpectatorId?: () => string;
  broadcastEvents?: (gameId: string, events: import('../domain/types.js').MultiplayerEvent[]) => Promise<void>;
}
