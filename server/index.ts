import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import { Game } from "../src/shared/game.js";
import type {
  CreateGameResponse,
  ListGamesResponse,
  MultiplayerGameStatus,
  MultiplayerGameSummary,
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
}

function toGameSummary(game: MultiplayerGameRecord): MultiplayerGameSummary {
  return {
    id: game.id,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    openSeatCount: game.status === "waiting" ? 1 : 0,
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

  createWaitingGame(): MultiplayerGameSummary {
    const timestamp = new Date().toISOString();
    const game: MultiplayerGameRecord = {
      id: randomUUID(),
      status: "waiting",
      createdAt: timestamp,
      updatedAt: timestamp,
      game: new Game(),
    };

    this.games.set(game.id, game);

    return toGameSummary(game);
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
      game,
      joinCode: game.id,
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
