import type { IncomingMessage } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import type { GameStore } from "./store";

export type WsHub = {
  broadcast: (gameId: string, message: unknown) => void;
};

export function attachWebSocketServer(
  server: import("http").Server,
  store: GameStore
): WsHub {
  const wss = new WebSocketServer({ noServer: true });
  const listeners = new Map<string, Set<WebSocket>>();

  const broadcast = (gameId: string, message: unknown) => {
    const set = listeners.get(gameId);
    if (!set) {
      return;
    }
    const payload = JSON.stringify(message);
    for (const socket of set) {
      if (socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    }
  };

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://localhost");
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws, req: IncomingMessage) => {
    const url = new URL(req.url ?? "", "http://localhost");
    const gameId = url.searchParams.get("gameId");

    if (!gameId) {
      ws.close(1008, "missing gameId");
      return;
    }

    const game = store.getGame(gameId);
    if (!game) {
      ws.close(1008, "game not found");
      return;
    }

    const set = listeners.get(gameId) ?? new Set<WebSocket>();
    set.add(ws);
    listeners.set(gameId, set);

    ws.on("close", () => {
      const existing = listeners.get(gameId);
      if (!existing) {
        return;
      }
      existing.delete(ws);
      if (existing.size === 0) {
        listeners.delete(gameId);
      }
    });

    const payload = {
      type: "state_catchup",
      payload: {
        id: game.id,
        status: game.status,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        lastMoveAt: game.lastMoveAt,
        moveCount: game.moveCount,
        currentTurn: game.currentTurn,
        players: game.players,
        moves: game.moves,
        board: game.board,
      },
      timestamp: new Date().toISOString(),
    };

    ws.send(JSON.stringify(payload));
  });

  return { broadcast };
}
