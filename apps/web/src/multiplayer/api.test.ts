import { describe, expect, it, vi } from 'vitest';
import { MultiplayerApi } from './api';
import type { GameSnapshot } from './types';

const snapshot: GameSnapshot = {
  id: 'game-1', status: 'active', sequence: 2, board: Array(9).fill(null), moves: [],
  currentTurn: 'X', winner: null, endReason: null,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  turnStartedAt: '2026-09-01T00:00:00.000Z',
};

describe('MultiplayerApi', () => {
  it('sends player commands to the versioned API with the seat capability and sequence', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ game: snapshot, event: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const api = new MultiplayerApi('https://api.example.test/', request);

    await api.move(snapshot, 4, 'secret-seat-capability');

    const [url, init] = request.mock.calls[0];
    expect(url).toBe('https://api.example.test/api/v1/games/game-1/moves');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer secret-seat-capability');
    expect(JSON.parse(String(init?.body))).toMatchObject({ expectedSequence: 2, cell: 4 });
    expect(JSON.parse(String(init?.body)).commandId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('requests waiting games explicitly', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ items: [], nextCursor: null, consistency: 'eventual' })));
    await new MultiplayerApi('https://api.example.test', request).listWaitingGames();
    expect(request.mock.calls[0][0]).toBe('https://api.example.test/api/v1/games?status=waiting&limit=25');
  });
});

