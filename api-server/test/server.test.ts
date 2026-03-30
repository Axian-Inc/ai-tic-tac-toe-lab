import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import test from 'node:test';
import WebSocket from 'ws';
import { createAppServer } from '../src/server';
import { GameStore } from '../src/gameStore';

type JsonResponse = {
  statusCode: number;
  body: any;
};

function requestJson(port: number, method: string, path: string, body?: unknown): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ statusCode: res.statusCode ?? 0, body: parsed });
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

function connectWebSocketWithFirstMessage(url: string, timeoutMs = 3000): Promise<{ ws: WebSocket; firstMessage: any }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for websocket connection'));
    }, timeoutMs);

    let firstMessage: any = null;
    let isOpen = false;

    ws.on('message', (raw) => {
      if (!firstMessage) {
        firstMessage = JSON.parse(raw.toString());
      }

      if (isOpen && firstMessage) {
        clearTimeout(timeout);
        resolve({ ws, firstMessage });
      }
    });

    ws.once('open', () => {
      isOpen = true;
      if (firstMessage) {
        clearTimeout(timeout);
        resolve({ ws, firstMessage });
      }
    });

    ws.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function waitForMessage(ws: WebSocket, timeoutMs = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for websocket message'));
    }, timeoutMs);

    ws.once('message', (raw) => {
      try {
        clearTimeout(timeout);
        resolve(JSON.parse(raw.toString()));
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });

    ws.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

test('multiplayer lifecycle: create, join, move, and reject invalid turn', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }
    const port = address.port;

    const createRes = await requestJson(port, 'POST', '/games');
    assert.equal(createRes.statusCode, 201);
    assert.equal(createRes.body.assignedSymbol, 'X');
    assert.equal(createRes.body.game.players.X, true);
    assert.equal(createRes.body.game.players.O, false);
    assert.equal(createRes.body.game.status, 'waiting');

    const gameId = createRes.body.game.id;
    const xPlayerId = createRes.body.playerId;

    const joinRes = await requestJson(port, 'POST', `/games/${gameId}/join`);
    assert.equal(joinRes.statusCode, 200);
    assert.equal(joinRes.body.assignedSymbol, 'O');
    assert.equal(joinRes.body.game.status, 'active');

    const oPlayerId = joinRes.body.playerId;

    const badTurn = await requestJson(port, 'POST', `/games/${gameId}/moves`, {
      playerId: oPlayerId,
      position: 1,
    });
    assert.equal(badTurn.statusCode, 400);
    assert.equal(badTurn.body.error, 'NOT_YOUR_TURN');

    const xMove = await requestJson(port, 'POST', `/games/${gameId}/moves`, {
      playerId: xPlayerId,
      position: 0,
    });
    assert.equal(xMove.statusCode, 200);
    assert.equal(xMove.body.game.board[0], 'X');
    assert.equal(xMove.body.game.nextTurn, 'O');

    const oMove = await requestJson(port, 'POST', `/games/${gameId}/moves`, {
      playerId: oPlayerId,
      position: 4,
    });
    assert.equal(oMove.statusCode, 200);
    assert.equal(oMove.body.game.board[4], 'O');
    assert.equal(oMove.body.game.status, 'active');

    const stateRes = await requestJson(port, 'GET', `/games/${gameId}`);
    assert.equal(stateRes.statusCode, 200);
    assert.deepEqual(stateRes.body.game.board, ['X', null, null, null, 'O', null, null, null, null]);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('returns not found for unknown game', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }
    const port = address.port;

    const res = await requestJson(port, 'GET', '/games/11111111-1111-1111-1111-111111111111');
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'GAME_NOT_FOUND');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('websocket broadcasts updates to subscribers for game events', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  let ws: WebSocket | undefined;
  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }
    const port = address.port;

    const createRes = await requestJson(port, 'POST', '/games');
    const gameId = createRes.body.game.id;
    const xPlayerId = createRes.body.playerId;

    const connected = await connectWebSocketWithFirstMessage(
      `ws://127.0.0.1:${port}/wstest?gameId=${gameId}`
    );
    ws = connected.ws;
    const confirmEvent = connected.firstMessage;
    assert.equal(confirmEvent.type, 'subscription.confirmed');
    assert.equal(confirmEvent.gameId, gameId);

    const joinedEventPromise = waitForMessage(ws);
    const joinRes = await requestJson(port, 'POST', `/games/${gameId}/join`);
    assert.equal(joinRes.statusCode, 200);
    const joinedEvent = await joinedEventPromise;
    assert.equal(joinedEvent.type, 'game.joined');
    assert.equal(joinedEvent.game.id, gameId);
    assert.equal(joinedEvent.game.players.O, true);

    const updateEventPromise = waitForMessage(ws);
    const moveRes = await requestJson(port, 'POST', `/games/${gameId}/moves`, {
      playerId: xPlayerId,
      position: 0,
    });
    assert.equal(moveRes.statusCode, 200);
    const updatedEvent = await updateEventPromise;
    assert.equal(updatedEvent.type, 'game.updated');
    assert.equal(updatedEvent.game.board[0], 'X');
  } finally {
    if (ws) {
      ws.close();
      await once(ws, 'close');
    }
    server.close();
    await once(server, 'close');
  }
});

test('leave before first move returns game to waiting state', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }
    const port = address.port;

    const created = await requestJson(port, 'POST', '/games');
    const gameId = created.body.game.id;
    const xPlayerId = created.body.playerId;

    const joined = await requestJson(port, 'POST', `/games/${gameId}/join`);
    const oPlayerId = joined.body.playerId;
    assert.equal(joined.statusCode, 200);

    const left = await requestJson(port, 'POST', `/games/${gameId}/leave`, {
      playerId: oPlayerId,
    });
    assert.equal(left.statusCode, 200);
    assert.equal(left.body.game.status, 'waiting');
    assert.equal(left.body.game.players.X, true);
    assert.equal(left.body.game.players.O, false);
    assert.equal(left.body.game.winner, null);
    assert.equal(left.body.game.completedReason, null);

    const state = await requestJson(port, 'GET', `/games/${gameId}`);
    assert.equal(state.statusCode, 200);
    assert.equal(state.body.game.status, 'waiting');
    assert.equal(state.body.game.players.O, false);
    assert.equal(state.body.game.nextTurn, 'X');

    const rejoin = await requestJson(port, 'POST', `/games/${gameId}/join`);
    assert.equal(rejoin.statusCode, 200);
    assert.equal(rejoin.body.assignedSymbol, 'O');

    const xMove = await requestJson(port, 'POST', `/games/${gameId}/moves`, {
      playerId: xPlayerId,
      position: 0,
    });
    assert.equal(xMove.statusCode, 200);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('leave after moves finishes game', async () => {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }
    const port = address.port;

    const created = await requestJson(port, 'POST', '/games');
    const gameId = created.body.game.id;
    const xPlayerId = created.body.playerId;

    const joined = await requestJson(port, 'POST', `/games/${gameId}/join`);
    const oPlayerId = joined.body.playerId;
    assert.equal(joined.statusCode, 200);

    const moved = await requestJson(port, 'POST', `/games/${gameId}/moves`, {
      playerId: xPlayerId,
      position: 0,
    });
    assert.equal(moved.statusCode, 200);

    const left = await requestJson(port, 'POST', `/games/${gameId}/leave`, {
      playerId: oPlayerId,
    });
    assert.equal(left.statusCode, 200);
    assert.equal(left.body.game.status, 'over');
    assert.equal(left.body.game.completedReason, 'player_left');
    assert.equal(left.body.game.winner, 'X');
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('enforces concurrent game limit', async () => {
  const store = new GameStore(1);
  const server = createAppServer(store);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Invalid server address');
    }
    const port = address.port;

    const first = await requestJson(port, 'POST', '/games');
    assert.equal(first.statusCode, 201);

    const second = await requestJson(port, 'POST', '/games');
    assert.equal(second.statusCode, 429);
    assert.equal(second.body.error, 'GAME_LIMIT_REACHED');
  } finally {
    server.close();
    await once(server, 'close');
  }
});
