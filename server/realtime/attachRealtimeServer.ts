import { type Server as HttpServer } from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import { HttpError, MultiplayerService } from '../multiplayer/service';

export function attachRealtimeServer(server: HttpServer, service: MultiplayerService) {
  const webSocketServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket: WebSocket) => {
      webSocketServer.emit('connection', webSocket, request);
    });
  });

  webSocketServer.on('connection', (webSocket: WebSocket, request) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const gameId = url.searchParams.get('gameId');

    if (!gameId) {
      webSocket.close(1008, 'gameId is required');
      return;
    }

    try {
      webSocket.send(JSON.stringify(service.createResyncSnapshotEvent(gameId)));
    } catch (error) {
      const reason = error instanceof HttpError ? error.message : 'Unable to subscribe';
      webSocket.close(1008, reason);
      return;
    }

    const unsubscribe = service.subscribe((event) => {
      if (event.gameId !== gameId || webSocket.readyState !== webSocket.OPEN) {
        return;
      }

      webSocket.send(JSON.stringify(event));
    });

    webSocket.on('close', unsubscribe);
  });

  return webSocketServer;
}
