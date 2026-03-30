import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { GameStore, PublicGameState } from './gameStore';

type GameEvent = {
  type: string;
  game?: PublicGameState;
  gameId?: string;
};

function json(res: http.ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8');

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed;
  } catch {
    throw new Error('INVALID_JSON');
  }
}

function routeNotFound(res: http.ServerResponse): void {
  json(res, 404, { error: 'NOT_FOUND' });
}

function mapErrorToStatus(errorCode: string): number {
  switch (errorCode) {
    case 'GAME_NOT_FOUND':
      return 404;
    case 'GAME_FULL':
    case 'INVALID_POSITION':
    case 'PLAYER_NOT_IN_GAME':
    case 'GAME_NOT_READY':
    case 'GAME_ALREADY_FINISHED':
    case 'NOT_YOUR_TURN':
    case 'CELL_ALREADY_TAKEN':
    case 'INVALID_JSON':
      return 400;
    case 'GAME_LIMIT_REACHED':
      return 429;
    default:
      return 500;
  }
}

export function createAppServer(store: GameStore = new GameStore()): http.Server {
  const gameSubscriptions = new Map<string, Set<WebSocket>>();
  const wsServer = new WebSocketServer({ noServer: true });

  function subscribe(gameId: string, socket: WebSocket): void {
    const current = gameSubscriptions.get(gameId) || new Set<WebSocket>();
    current.add(socket);
    gameSubscriptions.set(gameId, current);
  }

  function unsubscribe(gameId: string, socket: WebSocket): void {
    const current = gameSubscriptions.get(gameId);
    if (!current) {
      return;
    }

    current.delete(socket);
    if (current.size === 0) {
      gameSubscriptions.delete(gameId);
    }
  }

  function broadcast(gameId: string, event: GameEvent): void {
    const current = gameSubscriptions.get(gameId);
    if (!current || current.size === 0) {
      return;
    }

    const payload = JSON.stringify(event);
    for (const socket of current) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      });
      res.end();
      return;
    }

    try {
      const requestUrl = req.url ?? '';

      if (req.method === 'GET' && requestUrl === '/health') {
        json(res, 200, { ok: true });
        return;
      }

      if (req.method === 'POST' && requestUrl === '/games') {
        const payload = store.createGame();
        broadcast(payload.game.id, {
          type: 'game.created',
          game: payload.game,
        });
        json(res, 201, payload);
        return;
      }

      const gameMatch = requestUrl.match(/^\/games\/([0-9a-fA-F-]+)$/);
      if (req.method === 'GET' && gameMatch) {
        const game = store.getGame(gameMatch[1]);
        json(res, 200, { game });
        return;
      }

      const joinMatch = requestUrl.match(/^\/games\/([0-9a-fA-F-]+)\/join$/);
      if (req.method === 'POST' && joinMatch) {
        const payload = store.joinGame(joinMatch[1]);
        broadcast(payload.game.id, {
          type: 'game.joined',
          game: payload.game,
        });
        json(res, 200, payload);
        return;
      }

      const moveMatch = requestUrl.match(/^\/games\/([0-9a-fA-F-]+)\/moves$/);
      if (req.method === 'POST' && moveMatch) {
        const body = await readJsonBody(req);
        const playerId = typeof body.playerId === 'string' ? body.playerId : '';
        const position = typeof body.position === 'number' ? body.position : Number.NaN;

        const game = store.makeMove(moveMatch[1], playerId, position);
        broadcast(game.id, {
          type: 'game.updated',
          game,
        });
        json(res, 200, { game });
        return;
      }

      const leaveMatch = requestUrl.match(/^\/games\/([0-9a-fA-F-]+)\/leave$/);
      if (req.method === 'POST' && leaveMatch) {
        const body = await readJsonBody(req);
        const playerId = typeof body.playerId === 'string' ? body.playerId : '';
        const game = store.leaveGame(leaveMatch[1], playerId);
        broadcast(game.id, {
          type: 'game.updated',
          game,
        });
        json(res, 200, { game });
        return;
      }

      routeNotFound(res);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      const statusCode = mapErrorToStatus(errorCode);
      json(res, statusCode, { error: errorCode });
    }
  });

  server.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url ?? '', 'http://localhost');
      if (url.pathname !== '/wstest') {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      const gameId = url.searchParams.get('gameId');
      if (!gameId) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      store.getGame(gameId);

      wsServer.handleUpgrade(req, socket, head, (ws) => {
        console.log('wsServer handleUpgrade', Date.now());

        subscribe(gameId, ws);
        setImmediate(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'subscription.confirmed',
                gameId,
              })
            );
          }
        });

        ws.on('close', () => {
          unsubscribe(gameId, ws);
        });
      });
    } catch {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
    }
  });

  server.on('close', () => {
    wsServer.clients.forEach((client) => client.terminate());
    gameSubscriptions.clear();
  });

  return server;
}
