import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from '../apiClient';

const baseState = {
  board: Array(9).fill(null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-123',
};

const createResponse = (body: unknown, init?: ResponseInit) => {
  if (typeof body === 'string') {
    return new Response(body, init);
  }

  return new Response(JSON.stringify(body), init);
};

describe('createApiClient', () => {
  it('rejects invalid new game requests without calling fetch', async () => {
    const fetchFn = vi.fn();
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.newGame({ startingPlayer: 'X', opponentId: '' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorCode).toBe('INVALID_INPUT');
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('strips trailing slashes from the base url', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(baseState, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = createApiClient({ baseUrl: 'http://example.com/', fetchFn });

    await client.newGame({ startingPlayer: 'X', opponentId: 'balanced' });

    expect(fetchFn).toHaveBeenCalledWith('http://example.com/v1/new-game', expect.anything());
  });

  it('returns data for successful move responses', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        {
          state: baseState,
          aiRationale: 'Taking the center keeps options open.',
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.move({
      state: baseState,
      playerMoveIndex: 4,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.state).toEqual(baseState);
    }
  });

  it('returns INVALID_RESPONSE for successful responses with invalid data', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse({ not: 'valid' }, { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.move({
      state: baseState,
      playerMoveIndex: 4,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorCode).toBe('INVALID_RESPONSE');
    }
  });

  it('returns server error details for non-OK responses', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        { errorCode: 'INVALID_MOVE', message: 'Cell is occupied.' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.move({
      state: baseState,
      playerMoveIndex: 4,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorCode).toBe('INVALID_MOVE');
    }
  });

  it('returns INVALID_RESPONSE for non-OK responses with invalid error shapes', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse({ message: 'Missing error code.' }, { status: 400, headers: { 'Content-Type': 'application/json' } }),
    );
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.move({
      state: baseState,
      playerMoveIndex: 4,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorCode).toBe('INVALID_RESPONSE');
    }
  });

  it('returns INVALID_JSON when the response body is not valid JSON', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse('{not json', { status: 500, headers: { 'Content-Type': 'application/json' } }),
    );
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.move({
      state: baseState,
      playerMoveIndex: 4,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorCode).toBe('INVALID_JSON');
    }
  });

  it('returns INVALID_RESPONSE when an OK response has an empty body', async () => {
    const fetchFn = vi.fn(async () => createResponse('', { status: 200 }));
    const client = createApiClient({ baseUrl: 'http://example.com', fetchFn });

    const result = await client.newGame({ startingPlayer: 'X', opponentId: 'balanced' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorCode).toBe('INVALID_RESPONSE');
    }
  });
});
