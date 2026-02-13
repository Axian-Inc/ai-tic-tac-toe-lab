import http from "http";
import express from "express";
import { GameStore, type GameStatus } from "./store.js";
import { attachWebSocketServer } from "./ws.js";
import { startAbandonmentSweeper } from "./abandonmentSweeper.js";
import { createPersistenceFromEnv } from "./persistence.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const persistence = createPersistenceFromEnv();
const store = new GameStore(persistence);
const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.header("Origin");
  let allowOrigin = "*";
  if (corsOrigins.length > 0) {
    allowOrigin = origin && corsOrigins.includes(origin) ? origin : corsOrigins[0];
  }
  res.header("Access-Control-Allow-Origin", allowOrigin);
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

if (process.env.NODE_ENV === "test") {
  app.post("/_test/reset", (_req, res) => {
    store.reset();
    res.status(204).end();
  });

  app.post("/_test/set-last-move", (req, res) => {
    const gameId = typeof req.body?.id === "string" ? req.body.id : null;
    const lastMoveAt = typeof req.body?.lastMoveAt === "string" ? req.body.lastMoveAt : null;
    if (!gameId || !lastMoveAt) {
      res.status(400).json({ code: "INVALID_REQUEST", message: "id and lastMoveAt required." });
      return;
    }
    try {
      store.setLastMoveAt(gameId, lastMoveAt).catch(() => undefined);
      res.status(204).end();
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ code: "NOT_FOUND", message: "Game not found." });
        return;
      }
      res.status(500).json({ code: "SERVER_ERROR", message: "Unexpected error." });
    }
  });
}

app.post("/games", (req, res) => {
  const creatorId = typeof req.body?.playerId === "string" ? req.body.playerId : undefined;
  (async () => {
    try {
      const game = await store.createGame(creatorId);
      res.status(201).json({
        id: game.id,
        status: game.status,
        createdAt: game.createdAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "MAX_GAMES_REACHED") {
        res.status(429).json({ code: "MAX_GAMES_REACHED", message: "Too many games." });
        return;
      }
      res.status(500).json({ code: "SERVER_ERROR", message: "Unexpected error." });
    }
  })();
});

app.get("/games", (req, res) => {
  const status = req.query.status;
  const allowed: GameStatus[] = ["waiting", "active", "over"];
  if (status && typeof status === "string" && !allowed.includes(status as GameStatus)) {
    res.status(400).json({ code: "INVALID_STATUS", message: "Invalid status filter." });
    return;
  }

  const games = store.listGames(status as GameStatus | undefined).map((game) => ({
    id: game.id,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    moveCount: game.moveCount,
  }));
  res.status(200).json({ games });
});

app.get("/games/:id", (req, res) => {
  const gameId = req.params.id;
  const game = store.getGame(gameId);
  if (!game) {
    res.status(404).json({ code: "NOT_FOUND", message: "Game not found." });
    return;
  }

  res.status(200).json({
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
    winner: game.winner,
  });
});

app.post("/games/:id/join", (req, res) => {
  const gameId = req.params.id;
  const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : null;
  if (!playerId) {
    res.status(400).json({ code: "MISSING_PLAYER_ID", message: "playerId required." });
    return;
  }

  (async () => {
    try {
      const game = await store.joinGame(gameId, playerId);
      const payload = {
        type: "player_joined",
        payload: {
          roomId: game.id,
        state: {
          status: game.status,
          board: game.board,
          moves: game.moves,
          moveCount: game.moveCount,
          currentTurn: game.currentTurn,
        },
        players: game.players,
      },
      timestamp: new Date().toISOString(),
    };
    hub.broadcast(game.id, payload);
    res.status(200).json({
      event: "player_joined",
      game: {
        id: game.id,
        status: game.status,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        moveCount: game.moveCount,
        currentTurn: game.currentTurn,
        players: game.players,
      },
    });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ code: "NOT_FOUND", message: "Game not found." });
        return;
      }
      if (error instanceof Error && error.message === "NOT_JOINABLE") {
        res.status(409).json({ code: "NOT_JOINABLE", message: "Game cannot be joined." });
        return;
      }
      res.status(500).json({ code: "SERVER_ERROR", message: "Unexpected error." });
    }
  })();
});

const server = http.createServer(app);
const hub = attachWebSocketServer(server, store);
const sweepIntervalEnv = process.env.ABANDONMENT_SWEEP_INTERVAL_MS;
const sweepIntervalMs =
  sweepIntervalEnv !== undefined
    ? Number(sweepIntervalEnv)
    : process.env.NODE_ENV === "test"
      ? 0
      : 60_000;

startAbandonmentSweeper(store, hub, { intervalMs: sweepIntervalMs });

app.post("/games/:id/moves", (req, res) => {
  const gameId = req.params.id;
  const index = req.body?.index;
  const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : null;

  if (!Number.isInteger(index)) {
    res.status(400).json({ code: "INVALID_INDEX", message: "index must be 0-8." });
    return;
  }

  if (!playerId) {
    res.status(400).json({ code: "MISSING_PLAYER_ID", message: "playerId required." });
    return;
  }

  (async () => {
    try {
      const game = await store.applyMove(gameId, playerId, Number(index));
    const move = game.moves[game.moves.length - 1];
    const payload = {
      type: "move_accepted",
      payload: {
        roomId: game.id,
        state: {
          status: game.status,
          board: game.board,
          moves: game.moves,
          moveCount: game.moveCount,
          currentTurn: game.currentTurn,
          winner: game.winner,
        },
        move,
        currentTurn: game.currentTurn,
      },
      timestamp: new Date().toISOString(),
    };

    hub.broadcast(game.id, payload);
    res.status(200).json(payload);

    if (game.status === "over") {
      const gameOver = {
        type: "game_over",
        payload: {
          roomId: game.id,
          state: {
            status: game.status,
            board: game.board,
            moves: game.moves,
            moveCount: game.moveCount,
          },
          winner: game.winner,
          reason: game.winner ? "win" : "draw",
        },
        timestamp: new Date().toISOString(),
      };
      hub.broadcast(game.id, gameOver);
    }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "SERVER_ERROR";
      const errorMap: Record<string, { status: number; code: string; message: string }> = {
        NOT_FOUND: { status: 404, code: "NOT_FOUND", message: "Game not found." },
        GAME_NOT_ACTIVE: { status: 409, code: "GAME_NOT_ACTIVE", message: "Game not active." },
        PLAYER_NOT_IN_GAME: {
          status: 403,
          code: "PLAYER_NOT_IN_GAME",
          message: "Player not part of this game.",
        },
        NOT_YOUR_TURN: { status: 409, code: "NOT_YOUR_TURN", message: "Not your turn." },
        CELL_OCCUPIED: { status: 409, code: "CELL_OCCUPIED", message: "Cell occupied." },
        INVALID_INDEX: { status: 400, code: "INVALID_INDEX", message: "index must be 0-8." },
      };

      const mapped = errorMap[reason] ?? {
        status: 500,
        code: "SERVER_ERROR",
        message: "Unexpected error.",
      };

      const rejection = {
        type: "move_rejected",
        payload: {
          roomId: gameId,
          error: { code: mapped.code, message: mapped.message },
        },
        timestamp: new Date().toISOString(),
      };

      hub.broadcast(gameId, rejection);
      res.status(mapped.status).json({ code: mapped.code, message: mapped.message });
    }
  })();
});

app.post("/games/:id/resign", (req, res) => {
  const gameId = req.params.id;
  const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : null;

  if (!playerId) {
    res.status(400).json({ code: "MISSING_PLAYER_ID", message: "playerId required." });
    return;
  }

  (async () => {
    try {
      const game = await store.resignGame(gameId, playerId);
    const payload = {
      type: "game_over",
      payload: {
        roomId: game.id,
        state: {
          status: game.status,
          board: game.board,
          moves: game.moves,
          moveCount: game.moveCount,
        },
        winner: game.winner,
        reason: "resign",
      },
      timestamp: new Date().toISOString(),
    };

    hub.broadcast(game.id, payload);
    res.status(200).json(payload);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "SERVER_ERROR";
      const errorMap: Record<string, { status: number; code: string; message: string }> = {
        NOT_FOUND: { status: 404, code: "NOT_FOUND", message: "Game not found." },
        GAME_NOT_ACTIVE: { status: 409, code: "GAME_NOT_ACTIVE", message: "Game not active." },
        PLAYER_NOT_IN_GAME: {
          status: 403,
          code: "PLAYER_NOT_IN_GAME",
          message: "Player not part of this game.",
        },
      };

      const mapped = errorMap[reason] ?? {
        status: 500,
        code: "SERVER_ERROR",
        message: "Unexpected error.",
      };

      res.status(mapped.status).json({ code: mapped.code, message: mapped.message });
    }
  })();
});

app.post("/games/:id/rematch", (req, res) => {
  const gameId = req.params.id;
  const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : null;

  if (!playerId) {
    res.status(400).json({ code: "MISSING_PLAYER_ID", message: "playerId required." });
    return;
  }

  const existing = store.getGame(gameId);
  if (!existing) {
    res.status(404).json({ code: "NOT_FOUND", message: "Game not found." });
    return;
  }

  (async () => {
    try {
      const newGame = await store.createGame(playerId);
    const payload = {
      type: "rematch_invite",
      payload: {
        roomId: gameId,
        newGameId: newGame.id,
      },
      timestamp: new Date().toISOString(),
    };
    hub.broadcast(gameId, payload);
    res.status(201).json({
      id: newGame.id,
      status: newGame.status,
      createdAt: newGame.createdAt,
    });
    } catch (error) {
      if (error instanceof Error && error.message === "MAX_GAMES_REACHED") {
        res.status(429).json({ code: "MAX_GAMES_REACHED", message: "Too many games." });
        return;
      }
      res.status(500).json({ code: "SERVER_ERROR", message: "Unexpected error." });
    }
  })();
});

app.post("/games/:id/abandonment-check", (req, res) => {
  const gameId = req.params.id;
  const playerId = typeof req.body?.playerId === "string" ? req.body.playerId : null;

  if (!playerId) {
    res.status(400).json({ code: "MISSING_PLAYER_ID", message: "playerId required." });
    return;
  }

  (async () => {
    try {
      const result = await store.checkAbandonment(gameId, playerId);
    if (!result.abandoned) {
      res.status(200).json({
        abandoned: false,
        reason: result.reason,
        lastMoveAt: result.game.lastMoveAt,
        thresholdSeconds: 180,
      });
      return;
    }

    const payload = {
      type: "abandoned",
      payload: {
        roomId: result.game.id,
        state: {
          status: result.game.status,
          board: result.game.board,
          moves: result.game.moves,
          moveCount: result.game.moveCount,
        },
        winner: result.game.winner,
        reason: "abandon",
      },
      timestamp: new Date().toISOString(),
    };

    hub.broadcast(result.game.id, payload);
    res.status(200).json(payload);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "SERVER_ERROR";
      const errorMap: Record<string, { status: number; code: string; message: string }> = {
        NOT_FOUND: { status: 404, code: "NOT_FOUND", message: "Game not found." },
        GAME_NOT_ACTIVE: { status: 409, code: "GAME_NOT_ACTIVE", message: "Game not active." },
        PLAYER_NOT_IN_GAME: {
          status: 403,
          code: "PLAYER_NOT_IN_GAME",
          message: "Player not part of this game.",
        },
      };

      const mapped = errorMap[reason] ?? {
        status: 500,
        code: "SERVER_ERROR",
        message: "Unexpected error.",
      };

      res.status(mapped.status).json({ code: mapped.code, message: mapped.message });
    }
  })();
});

async function start() {
  await store.hydrate();
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
