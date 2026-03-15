import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import { Game, type Player } from "../src/shared/game.js";
import type {
  CreateGameResponse,
  GetGameResponse,
  JoinGameResponse,
  ListGamesResponse,
  MultiplayerGameSnapshot,
  MultiplayerGameStatus,
  MultiplayerPlayerAssignments,
  MultiplayerGameSummary,
  MultiplayerSession,
} from "../src/shared/multiplayer.js";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "0.0.0.0";
const MAX_CONCURRENT_GAMES = 25;
const SUPPORTED_GAME_STATUSES: ReadonlySet<MultiplayerGameStatus> = new Set([
  "waiting",
  "active",
  "over",
]);

const serviceStartedAt = new Date().toISOString();

interface MultiplayerGameRecord {
  id: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  game: Game;
  players: MultiplayerPlayerAssignments;
}

function toGameSummary(game: MultiplayerGameRecord): MultiplayerGameSummary {
  const openSeatCount = game.players.O === null ? 1 : 0;

  return {
    id: game.id,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    openSeatCount,
  };
}

function toGameSnapshot(game: MultiplayerGameRecord): MultiplayerGameSnapshot {
  return {
    ...toGameSummary(game),
    players: {
      X: { ...game.players.X },
      O: game.players.O ? { ...game.players.O } : null,
    },
    state: game.game.getState(),
  };
}

function createSession(gameId: string, player: Player): MultiplayerSession {
  return {
    gameId,
    player,
    mode: "multiplayer",
  };
}

class InMemoryMultiplayerGameStore {
  private readonly games = new Map<string, MultiplayerGameRecord>();

  list(status?: MultiplayerGameStatus): MultiplayerGameSummary[] {
    return Array.from(this.games.values())
      .filter((game) => (status ? game.status === status : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toGameSummary);
  }

  getConcurrentGameCount(): number {
    return Array.from(this.games.values()).filter(
      (game) => game.status === "waiting" || game.status === "active"
    ).length;
  }

  createWaitingGame(): MultiplayerGameRecord {
    const timestamp = new Date().toISOString();
    const game: MultiplayerGameRecord = {
      id: randomUUID(),
      status: "waiting",
      createdAt: timestamp,
      updatedAt: timestamp,
      game: new Game(),
      players: {
        X: {
          player: "X",
          joinedAt: timestamp,
        },
        O: null,
      },
    };

    this.games.set(game.id, game);

    return game;
  }

  get(id: string): MultiplayerGameRecord | undefined {
    return this.games.get(id);
  }

  joinWaitingGame(id: string): MultiplayerGameRecord | "not_found" | "not_joinable" {
    const game = this.games.get(id);

    if (!game) {
      return "not_found";
    }

    if (game.status !== "waiting" || game.players.O !== null) {
      return "not_joinable";
    }

    const timestamp = new Date().toISOString();
    game.players = {
      ...game.players,
      O: {
        player: "O",
        joinedAt: timestamp,
      },
    };
    game.status = "active";
    game.updatedAt = timestamp;

    return game;
  }
}

export function createMultiplayerApp() {
  const app = express();
  const gameStore = new InMemoryMultiplayerGameStore();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use((request, response, next) => {
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    response.setHeader("access-control-allow-headers", "content-type");

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
  });

  app.get("/health", (_request, response) => {
    response.setHeader("cache-control", "no-store");
    response.status(200).json({
      status: "ok",
      service: "multiplayer-service",
      startedAt: serviceStartedAt,
      uptimeSeconds: Number(process.uptime().toFixed(3)),
    });
  });

  app.get("/ready", (_request, response) => {
    const game = new Game();

    response.setHeader("cache-control", "no-store");
    response.status(200).json({
      status: "ready",
      service: "multiplayer-service",
      checks: {
        sharedGameDomain: game.getState().board.length === 9 ? "ok" : "failed",
      },
    });
  });

  app.post("/games", (_request, response) => {
    response.setHeader("cache-control", "no-store");

    if (gameStore.getConcurrentGameCount() >= MAX_CONCURRENT_GAMES) {
      response.status(429).json({
        status: "capacity_reached",
        message: "The multiplayer service is at capacity. Try again later.",
        maxConcurrentGames: MAX_CONCURRENT_GAMES,
      });
      return;
    }

    const game = gameStore.createWaitingGame();
    const payload: CreateGameResponse = {
      game: toGameSnapshot(game),
      joinCode: game.id,
      session: createSession(game.id, "X"),
    };

    response.status(201).json(payload);
  });

  app.get("/games", (request, response) => {
    response.setHeader("cache-control", "no-store");

    const rawStatus = request.query.status;
    const status =
      typeof rawStatus === "string" ? (rawStatus as MultiplayerGameStatus) : undefined;

    if (status !== undefined && !SUPPORTED_GAME_STATUSES.has(status)) {
      response.status(400).json({
        status: "invalid_status",
        message: "Query parameter status must be one of waiting, active, or over.",
      });
      return;
    }

    const payload: ListGamesResponse = {
      games: gameStore.list(status),
    };

    response.status(200).json(payload);
  });

  app.get("/games/:id", (request, response) => {
    response.setHeader("cache-control", "no-store");

    const game = gameStore.get(request.params.id);

    if (!game) {
      response.status(404).json({
        status: "not_found",
        message: "Game not found.",
      });
      return;
    }

    const payload: GetGameResponse = {
      game: toGameSnapshot(game),
    };

    response.status(200).json(payload);
  });

  app.post("/games/:id/join", (request, response) => {
    response.setHeader("cache-control", "no-store");

    const result = gameStore.joinWaitingGame(request.params.id);

    if (result === "not_found") {
      response.status(404).json({
        status: "not_found",
        message: "Game not found.",
      });
      return;
    }

    if (result === "not_joinable") {
      response.status(409).json({
        status: "not_joinable",
        message: "Only waiting games with one open player slot can be joined.",
      });
      return;
    }

    const payload: JoinGameResponse = {
      game: toGameSnapshot(result),
      session: createSession(result.id, "O"),
    };

    response.status(200).json(payload);
  });

  app.use((_request, response) => {
    response.setHeader("cache-control", "no-store");
    response.status(404).json({
      status: "not_found",
      message: "Route not found.",
    });
  });

  return app;
}

export function startMultiplayerServer() {
  const parsedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  const port = Number.isNaN(parsedPort) ? DEFAULT_PORT : parsedPort;
  const host = process.env.HOST ?? DEFAULT_HOST;
  const app = createMultiplayerApp();
  const server = app.listen(port, host, () => {
    console.log(`Multiplayer service listening on http://${host}:${port}`);
  });

  return server;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  startMultiplayerServer();
}
