import { describe, expect, it, vi } from 'vitest';
import { MultiplayerConnection } from './connection';
import type { MultiplayerApi } from './api';
import type { GameSnapshot } from './types';

const state = (sequence: number): GameSnapshot => ({
  id: 'game-1', status: 'active', sequence, board: Array(9).fill(null), moves: [],
  currentTurn: 'X', winner: null, endReason: null,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
  turnStartedAt: '2026-09-01T00:00:00.000Z',
});

class FakeSocket {
  readonly sent: string[] = [];
  private readonly listeners = new Map<string, Array<(event: { data?: string }) => void>>();

  addEventListener(type: string, listener: (event: { data?: string }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(value: string) { this.sent.push(value); }
  close() { /* Connection owns the lifecycle; no server close event is needed here. */ }
  emit(type: string, data?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener({ data: data === undefined ? undefined : JSON.stringify(data) });
  }
}

describe('MultiplayerConnection', () => {
  it('subscribes from the last applied sequence, deduplicates, and fills a sequence gap through replay', async () => {
    const socket = new FakeSocket();
    const snapshots: number[] = [];
    const getEvents = vi.fn().mockResolvedValue({
      items: [{ sequence: 2, state: state(2) }], nextCursor: null, throughSequence: 2,
    });
    const connection = new MultiplayerConnection({
      api: { getEvents } as unknown as MultiplayerApi,
      webSocketUrl: 'wss://api.example.test/ws', gameId: 'game-1', initialSnapshot: state(1),
      onSnapshot: (snapshot) => snapshots.push(snapshot.sequence), onStatus: vi.fn(), onError: vi.fn(),
      socketFactory: () => socket as unknown as WebSocket,
    });

    connection.start();
    socket.emit('open');
    expect(JSON.parse(socket.sent[0])).toMatchObject({ action: 'subscribe', gameId: 'game-1', afterSequence: 1 });

    socket.emit('message', { version: 1, type: 'game.event', gameId: 'game-1', sequence: 3, state: state(3) });
    await vi.waitFor(() => expect(snapshots).toEqual([2, 3]));
    expect(getEvents).toHaveBeenCalledWith('game-1', 1, undefined);

    socket.emit('message', { version: 1, type: 'game.event', gameId: 'game-1', sequence: 3, state: state(3) });
    expect(snapshots).toEqual([2, 3]);
    connection.stop();
  });
});

