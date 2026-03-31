import { type AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/http/createApp';
import { MultiplayerService } from '../../server/multiplayer/service';
import {
  AbandonmentCheckResponse,
  CreateGameResponse,
  JoinGameResponse,
  ListGamesResponse,
  MAX_CONCURRENT_MULTIPLAYER_GAMES,
  ResignGameResponse,
  SubmitMoveResponse,
} from '../../shared/contracts';

describe('multiplayer lifecycle api', () => {
  let now = new Date('2026-03-31T15:00:00.000Z');
  let server: ReturnType<typeof createApp>;
  let baseUrl = '';

  beforeEach(async () => {
    server = createApp(new MultiplayerService(() => new Date(now)));
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('creates and lists waiting games', async () => {
    const created = await postJson<CreateGameResponse>('/games', {});

    expect(created.status).toBe(201);
    expect(created.body.game.status).toBe('waiting');
    expect(created.body.participant.role).toBe('host');
    expect(created.body.event.type).toBe('game.snapshot');

    const listed = await fetchJson<ListGamesResponse>('/games?status=waiting');

    expect(listed.status).toBe(200);
    expect(listed.body.games.some((game) => game.id === created.body.game.id)).toBe(true);
  });

  it('joins a waiting game and validates turn ownership for moves', async () => {
    now = new Date('2026-03-31T15:05:00.000Z');
    const created = await postJson<CreateGameResponse>('/games', {});
    const joined = await postJson<JoinGameResponse>(`/games/${created.body.game.id}/join`, {});

    expect(joined.status).toBe(200);
    expect(joined.body.game.status).toBe('active');
    expect(joined.body.participant.role).toBe('guest');
    expect(joined.body.event.type).toBe('game.player.joined');

    const hostMove = await postJson<SubmitMoveResponse>(`/games/${created.body.game.id}/moves`, {
      sessionId: created.body.participant.sessionId,
      position: 0,
      expectedTurn: 1,
    });

    expect(hostMove.status).toBe(200);
    expect(hostMove.body.game.board[0]).toBe('X');
    expect(hostMove.body.event.type).toBe('game.move.accepted');

    const wrongTurn = await postJson<{ error: string }>(`/games/${created.body.game.id}/moves`, {
      sessionId: created.body.participant.sessionId,
      position: 4,
      expectedTurn: 2,
    });

    expect(wrongTurn.status).toBe(403);

    const guestMove = await postJson<SubmitMoveResponse>(`/games/${created.body.game.id}/moves`, {
      sessionId: joined.body.participant.sessionId,
      position: 4,
      expectedTurn: 2,
    });

    expect(guestMove.status).toBe(200);
    expect(guestMove.body.game.board[4]).toBe('O');
  });

  it('supports resigning and abandonment checks', async () => {
    now = new Date('2026-03-31T15:10:00.000Z');
    const resignedGame = await postJson<CreateGameResponse>('/games', {});
    const resignedJoin = await postJson<JoinGameResponse>(`/games/${resignedGame.body.game.id}/join`, {});

    const resigned = await postJson<ResignGameResponse>(`/games/${resignedGame.body.game.id}/resign`, {
      sessionId: resignedJoin.body.participant.sessionId,
    });

    expect(resigned.status).toBe(200);
    expect(resigned.body.game.status).toBe('over');
    expect(resigned.body.game.endReason).toBe('resigned');
    expect(resigned.body.game.winner).toBe('X');

    now = new Date('2026-03-31T15:20:00.000Z');
    const abandonedGame = await postJson<CreateGameResponse>('/games', {});
    const abandonedJoin = await postJson<JoinGameResponse>(`/games/${abandonedGame.body.game.id}/join`, {});

    await postJson<SubmitMoveResponse>(`/games/${abandonedGame.body.game.id}/moves`, {
      sessionId: abandonedGame.body.participant.sessionId,
      position: 0,
      expectedTurn: 1,
    });

    now = new Date('2026-03-31T15:24:30.000Z');
    const abandonment = await postJson<AbandonmentCheckResponse>(
      `/games/${abandonedGame.body.game.id}/abandonment-check`,
      {
        sessionId: abandonedJoin.body.participant.sessionId,
      },
    );

    expect(abandonment.status).toBe(200);
    expect(abandonment.body.wasAbandoned).toBe(true);
    expect(abandonment.body.game.status).toBe('over');
    expect(abandonment.body.game.endReason).toBe('abandoned');
    expect(abandonment.body.event?.type).toBe('game.abandoned');
  });

  it('returns 429 once the concurrent game cap is reached', async () => {
    now = new Date('2026-03-31T15:30:00.000Z');

    for (let index = 0; index < MAX_CONCURRENT_MULTIPLAYER_GAMES; index += 1) {
      const created = await postJson<CreateGameResponse>('/games', {});
      expect(created.status).toBe(201);
    }

    const rejected = await postJson<{ error: string }>('/games', {});

    expect(rejected.status).toBe(429);
    expect(rejected.body.error).toMatch(/concurrent game limit/i);
  });

  it('rejects invalid resign and abandonment edge cases', async () => {
    now = new Date('2026-03-31T15:40:00.000Z');
    const created = await postJson<CreateGameResponse>('/games', {});

    const resignBeforeJoin = await postJson<{ error: string }>(`/games/${created.body.game.id}/resign`, {
      sessionId: created.body.participant.sessionId,
    });

    expect(resignBeforeJoin.status).toBe(409);
    expect(resignBeforeJoin.body.error).toMatch(/before a guest joins/i);

    const joined = await postJson<JoinGameResponse>(`/games/${created.body.game.id}/join`, {});
    await postJson<SubmitMoveResponse>(`/games/${created.body.game.id}/moves`, {
      sessionId: created.body.participant.sessionId,
      position: 0,
      expectedTurn: 1,
    });

    const tooEarly = await postJson<AbandonmentCheckResponse>(`/games/${created.body.game.id}/abandonment-check`, {
      sessionId: joined.body.participant.sessionId,
      observedAt: '2026-03-31T15:41:00.000Z',
    });

    expect(tooEarly.status).toBe(200);
    expect(tooEarly.body.wasAbandoned).toBe(false);

    const invalidTimestamp = await postJson<{ error: string }>(`/games/${created.body.game.id}/abandonment-check`, {
      sessionId: joined.body.participant.sessionId,
      observedAt: 'not-a-date',
    });

    expect(invalidTimestamp.status).toBe(400);
    expect(invalidTimestamp.body.error).toMatch(/valid ISO timestamp/i);

    const unknownSession = await postJson<{ error: string }>(`/games/${created.body.game.id}/resign`, {
      sessionId: 'session_unknown',
    });

    expect(unknownSession.status).toBe(403);
  });

  async function fetchJson<T>(path: string) {
    const response = await fetch(`${baseUrl}${path}`);

    return {
      status: response.status,
      body: (await response.json()) as T,
    };
  }

  async function postJson<T>(path: string, body: unknown) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      body: (await response.json()) as T,
    };
  }
});
