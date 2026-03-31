import { type AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createApp } from '../../server/http/createApp';
import { MultiplayerService } from '../../server/multiplayer/service';
import { attachRealtimeServer } from '../../server/realtime/attachRealtimeServer';
import type {
  CreateGameResponse,
  JoinGameResponse,
  MultiplayerServerEvent,
  SubmitMoveResponse,
} from '../../shared/contracts';

describe('multiplayer websocket transport', () => {
  let now = new Date('2026-03-31T16:00:00.000Z');
  const service = new MultiplayerService(() => new Date(now));
  const server = createApp(service);
  attachRealtimeServer(server, service);
  let httpBaseUrl = '';
  let wsBaseUrl = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        httpBaseUrl = `http://127.0.0.1:${address.port}`;
        wsBaseUrl = `ws://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
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

  it('sends a resync snapshot when a client subscribes to a game', async () => {
    const created = await postJson<CreateGameResponse>('/games', {});
    const joined = await postJson<JoinGameResponse>(`/games/${created.body.game.id}/join`, {});

    await postJson<SubmitMoveResponse>(`/games/${created.body.game.id}/moves`, {
      sessionId: created.body.participant.sessionId,
      position: 0,
      expectedTurn: 1,
    });

    const snapshot = await receiveSingleEvent(`${wsBaseUrl}/ws?gameId=${created.body.game.id}`);

    expect(snapshot.type).toBe('game.snapshot');
    expect(snapshot.reason).toBe('resync');
    expect(snapshot.game.moves).toHaveLength(1);
    expect(snapshot.game.moves[0]?.acceptedAt).toBe('2026-03-31T16:00:00.000Z');
    expect(snapshot.game.players.guest?.sessionId).toBe(joined.body.participant.sessionId);
  });

  it('broadcasts live events to subscribers for the selected game', async () => {
    now = new Date('2026-03-31T16:05:00.000Z');
    const created = await postJson<CreateGameResponse>('/games', {});
    await postJson<JoinGameResponse>(`/games/${created.body.game.id}/join`, {});
    const webSocket = new WebSocket(`${wsBaseUrl}/ws?gameId=${created.body.game.id}`);
    const received: MultiplayerServerEvent[] = [];

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for websocket events.')), 2000);

      webSocket.on('message', (raw) => {
        const event = JSON.parse(raw.toString()) as MultiplayerServerEvent;
        received.push(event);

        if (received.length === 2) {
          clearTimeout(timer);
          resolve();
        }
      });

      webSocket.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });

      webSocket.on('open', () => {
        void postJson<SubmitMoveResponse>(`/games/${created.body.game.id}/moves`, {
          sessionId: created.body.participant.sessionId,
          position: 0,
          expectedTurn: 1,
        }).catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
    });

    expect(received[0]?.type).toBe('game.snapshot');
    expect(received[0]?.reason).toBe('resync');
    expect(received[1]?.type).toBe('game.move.accepted');
    expect(received[1]?.game.moves).toHaveLength(1);

    webSocket.close();
  });

  async function postJson<T>(path: string, body: unknown) {
    const response = await fetch(`${httpBaseUrl}${path}`, {
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

async function receiveSingleEvent(url: string) {
  const webSocket = new WebSocket(url);

  return await new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      webSocket.close();
      reject(new Error('Timed out waiting for websocket snapshot.'));
    }, 2000);

    webSocket.on('message', (raw) => {
      clearTimeout(timer);
      const event = JSON.parse(raw.toString());
      webSocket.close();
      resolve(event);
    });

    webSocket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
