import { fileURLToPath } from "node:url";
import express from "express";
import { Game } from "../src/shared/game.js";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "0.0.0.0";

const serviceStartedAt = new Date().toISOString();

export function createMultiplayerApp() {
  const app = express();

  app.disable("x-powered-by");

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
