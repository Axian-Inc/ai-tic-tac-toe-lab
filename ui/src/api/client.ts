import { getApiHttpUrl } from "./config";
import type {
  AbandonmentCheckResponse,
  ApiErrorCode,
  ApiErrorResponse,
  CreateGameResponse,
  GetEventsResponse,
  GetGameResponse,
  JoinGameResponse,
  ListGamesResponse,
  MakeMoveResponse,
  ResignResponse,
} from "./types";

export class OnlineApiError extends Error {
  readonly code: ApiErrorCode | "NETWORK_ERROR";
  readonly status: number | null;

  constructor(code: ApiErrorCode | "NETWORK_ERROR", message: string, status: number | null) {
    super(message);
    this.name = "OnlineApiError";
    this.code = code;
    this.status = status;
  }
}

const encodePathSegment = (value: string): string => encodeURIComponent(value.trim());

const parseJson = async <T>(response: Response): Promise<T> => {
  const body = (await response.json()) as unknown;

  if (!response.ok) {
    const errorBody = body as Partial<ApiErrorResponse>;
    const apiError = errorBody.error;
    throw new OnlineApiError(
      apiError?.code ?? "NETWORK_ERROR",
      apiError?.message ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return body as T;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${getApiHttpUrl()}${path}`, {
      ...init,
      headers: {
        ...(init?.body === undefined ? undefined : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new OnlineApiError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Network request failed.",
      null,
    );
  }

  return parseJson<T>(response);
};

export const createGame = (displayName: string): Promise<CreateGameResponse> =>
  requestJson<CreateGameResponse>("/api/games", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });

export const listGames = (): Promise<ListGamesResponse> =>
  requestJson<ListGamesResponse>("/api/games");

export const joinGame = (gameId: string, displayName: string): Promise<JoinGameResponse> =>
  requestJson<JoinGameResponse>(`/api/games/${encodePathSegment(gameId)}/join`, {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });

export const getGame = (gameId: string): Promise<GetGameResponse> =>
  requestJson<GetGameResponse>(`/api/games/${encodePathSegment(gameId)}`);

export const getEvents = (
  gameId: string,
  afterSequence: number,
): Promise<GetEventsResponse> => {
  const searchParams = new URLSearchParams({ afterSequence: String(afterSequence) });

  return requestJson<GetEventsResponse>(
    `/api/games/${encodePathSegment(gameId)}/events?${searchParams.toString()}`,
  );
};

export const makeMove = (
  gameId: string,
  playerToken: string,
  cellIndex: number,
): Promise<MakeMoveResponse> =>
  requestJson<MakeMoveResponse>(`/api/games/${encodePathSegment(gameId)}/moves`, {
    method: "POST",
    body: JSON.stringify({ playerToken, cellIndex }),
  });

export const resign = (gameId: string, playerToken: string): Promise<ResignResponse> =>
  requestJson<ResignResponse>(`/api/games/${encodePathSegment(gameId)}/resign`, {
    method: "POST",
    body: JSON.stringify({ playerToken }),
  });

export const checkAbandonment = (
  gameId: string,
  playerToken: string,
): Promise<AbandonmentCheckResponse> =>
  requestJson<AbandonmentCheckResponse>(
    `/api/games/${encodePathSegment(gameId)}/abandonment-check`,
    {
      method: "POST",
      body: JSON.stringify({ playerToken }),
    },
  );
