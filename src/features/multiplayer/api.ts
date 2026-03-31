import type {
  CreateGameResponse,
  GetGameResponse,
  JoinGameResponse,
  ListGamesResponse,
  MultiplayerGameId,
  MultiplayerServerEvent,
  SubmitMoveResponse,
} from '../../../shared/contracts';

export async function createMultiplayerGame(): Promise<CreateGameResponse> {
  return requestJson('/games', {
    method: 'POST',
  });
}

export async function listWaitingGames(): Promise<ListGamesResponse> {
  return requestJson('/games?status=waiting');
}

export async function listActiveGames(): Promise<ListGamesResponse> {
  return requestJson('/games?status=active');
}

export async function getMultiplayerGame(gameId: MultiplayerGameId): Promise<GetGameResponse> {
  return requestJson(`/games/${gameId}`);
}

export async function joinMultiplayerGame(gameId: MultiplayerGameId): Promise<JoinGameResponse> {
  return requestJson(`/games/${gameId}/join`, {
    method: 'POST',
  });
}

export async function submitMultiplayerMove(
  gameId: MultiplayerGameId,
  sessionId: string,
  position: number,
  expectedTurn: number,
): Promise<SubmitMoveResponse> {
  return requestJson(`/games/${gameId}/moves`, {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      position,
      expectedTurn,
    }),
  });
}

export function connectToGameEvents(
  gameId: MultiplayerGameId,
  onEvent: (event: MultiplayerServerEvent) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws?gameId=${gameId}`);

  socket.addEventListener('open', () => {
    onConnectionChange?.(true);
  });

  socket.addEventListener('message', (message) => {
    const event = JSON.parse(message.data) as MultiplayerServerEvent;
    onEvent(event);
  });

  socket.addEventListener('close', () => {
    onConnectionChange?.(false);
  });

  socket.addEventListener('error', () => {
    onConnectionChange?.(false);
  });

  return () => {
    socket.close();
  };
}

async function requestJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  });

  const body = (await response.json()) as T | { error: string };

  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body ? body.error : 'Request failed.';
    throw new Error(message);
  }

  return body as T;
}
