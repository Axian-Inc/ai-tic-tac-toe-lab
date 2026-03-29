import type {
  AbandonmentCheckResponse,
  ApiErrorPayload,
  CreateGameResponse,
  JoinGameResponse,
  MoveResponse,
  MultiplayerGameDetailsResponse,
  ResignResponse,
  SpectateResponse,
  WaitingGameSummary,
} from './types';

class MultiplayerApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'MultiplayerApiError';
  }
}

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_MULTIPLAYER_API_BASE_URL;
  return configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, '') : '';
}

function buildApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

function buildWebSocketBaseUrl() {
  const configuredWebSocketUrl = import.meta.env.VITE_MULTIPLAYER_WS_URL;

  if (configuredWebSocketUrl) {
    return configuredWebSocketUrl.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

async function requestJson<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as TResponse | ApiErrorPayload) : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;

    throw new MultiplayerApiError(
      errorPayload?.error?.code ?? 'request_failed',
      errorPayload?.error?.message ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return payload as TResponse;
}

export function createGameUrl(gameId: string, mode: 'play' | 'join' = 'play') {
  if (typeof window === 'undefined') {
    return mode === 'join' ? `/game/${gameId}?join=1` : `/game/${gameId}`;
  }

  const url = new URL(`/game/${gameId}`, window.location.origin);

  if (mode === 'join') {
    url.searchParams.set('join', '1');
  }

  return url.toString();
}

export function createMultiplayerWebSocketUrl(
  gameId: string,
  participantType: 'player' | 'spectator',
  participantId: string,
) {
  const url = new URL(buildWebSocketBaseUrl(), typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  url.searchParams.set('gameId', gameId);
  url.searchParams.set('participantType', participantType);
  url.searchParams.set('participantId', participantId);
  return url.toString();
}

export async function createMultiplayerGame(gameName: string, playerName: string) {
  return requestJson<CreateGameResponse>('/games', {
    method: 'POST',
    body: JSON.stringify({ gameName, playerName }),
  });
}

export async function getGame(gameId: string) {
  return requestJson<MultiplayerGameDetailsResponse>(`/games/${gameId}`);
}

export async function listGames(status: 'waiting' | 'active' | 'over') {
  const response = await requestJson<{ games: WaitingGameSummary[] }>(`/games?status=${status}`);
  return response.games;
}

export async function joinGame(gameId: string, playerName: string) {
  return requestJson<JoinGameResponse>(`/games/${gameId}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  });
}

export async function submitMove(gameId: string, playerId: string, square: number) {
  return requestJson<MoveResponse>(`/games/${gameId}/moves`, {
    method: 'POST',
    body: JSON.stringify({ playerId, square }),
  });
}

export async function resignMultiplayerGame(gameId: string, playerId: string) {
  return requestJson<ResignResponse>(`/games/${gameId}/resign`, {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });
}

export async function spectateGame(gameId: string) {
  return requestJson<SpectateResponse>(`/games/${gameId}/spectate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function checkAbandonment(gameId: string, playerId: string) {
  return requestJson<AbandonmentCheckResponse>(`/games/${gameId}/abandonment-check`, {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });
}

export { MultiplayerApiError };
