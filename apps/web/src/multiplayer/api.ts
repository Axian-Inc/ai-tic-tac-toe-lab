import type { EventPage, GameList, GameSnapshot, ProblemDetails, SeatSession } from './types';

export class MultiplayerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly problem?: ProblemDetails,
  ) {
    super(message);
    this.name = 'MultiplayerApiError';
  }
}

const trimSlash = (value: string) => value.replace(/\/$/, '');

const commandId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export class MultiplayerApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string, private readonly request: typeof fetch = fetch) {
    this.baseUrl = `${trimSlash(baseUrl)}/api/v1`;
  }

  private async send<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      let problem: ProblemDetails | undefined;
      try {
        problem = (await response.json()) as ProblemDetails;
      } catch {
        // A proxy may return a non-JSON failure; retain the HTTP status below.
      }
      throw new MultiplayerApiError(
        problem?.detail ?? problem?.title ?? `Multiplayer request failed (${response.status}).`,
        response.status,
        problem,
      );
    }

    return (await response.json()) as T;
  }

  createGame(): Promise<SeatSession> {
    return this.send('/games', {
      method: 'POST',
      body: JSON.stringify({ commandId: commandId() }),
    });
  }

  listWaitingGames(): Promise<GameList> {
    return this.send('/games?status=waiting&limit=25');
  }

  joinGame(game: GameSnapshot): Promise<SeatSession> {
    return this.send(`/games/${encodeURIComponent(game.id)}/join`, {
      method: 'POST',
      body: JSON.stringify({ commandId: commandId(), expectedSequence: game.sequence }),
    });
  }

  getGame(gameId: string): Promise<GameSnapshot> {
    return this.send(`/games/${encodeURIComponent(gameId)}`);
  }

  getEvents(gameId: string, afterSequence: number, cursor?: string): Promise<EventPage> {
    const query = new URLSearchParams({ afterSequence: String(afterSequence), limit: '100' });
    if (cursor) query.set('cursor', cursor);
    return this.send(`/games/${encodeURIComponent(gameId)}/events?${query}`);
  }

  move(game: GameSnapshot, cell: number, seatToken: string) {
    return this.command(game, '/moves', seatToken, { cell });
  }

  resign(game: GameSnapshot, seatToken: string) {
    return this.command(game, '/resign', seatToken);
  }

  private command(
    game: GameSnapshot,
    path: string,
    seatToken: string,
    extra: Record<string, unknown> = {},
  ): Promise<{ game: GameSnapshot; event: unknown }> {
    return this.send(`/games/${encodeURIComponent(game.id)}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${seatToken}` },
      body: JSON.stringify({ commandId: commandId(), expectedSequence: game.sequence, ...extra }),
    });
  }
}

