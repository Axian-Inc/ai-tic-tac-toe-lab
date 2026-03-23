import { createHash, randomUUID } from "node:crypto";
import { createServer, type Server as HttpServer } from "node:http";
import { Socket } from "node:net";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import { Game, type Player } from "../src/shared/game.js";
import type {
  CreateGameRequest,
  CreateGameResponse,
  GetGameResponse,
  JoinGameResponse,
  ListGamesResponse,
  MultiplayerCompletion,
  MultiplayerConnectionReadyEvent,
  MultiplayerGameEvent,
  MultiplayerGameOverEvent,
  MultiplayerGameSnapshot,
  MultiplayerGameStatus,
  MultiplayerMoveAppliedEvent,
  MultiplayerMoveRequest,
  MultiplayerPlayerAssignments,
  MultiplayerPlayerSession,
  MultiplayerResignedEvent,
  MultiplayerResyncNeededEvent,
  MultiplayerServerEvent,
  MultiplayerGameSummary,
  ResignGameRequest,
  ResignGameResponse,
  SubmitMoveResponse,
} from "../src/shared/multiplayer.js";
import {
  MULTIPLAYER_GAME_NAME_MAX_LENGTH,
  MULTIPLAYER_PLAYER_NAME_MAX_LENGTH,
} from "../src/shared/multiplayer.js";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "0.0.0.0";
const MAX_CONCURRENT_GAMES = 25;
const WS_MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const SUPPORTED_GAME_STATUSES: ReadonlySet<MultiplayerGameStatus> = new Set([
  "waiting",
  "active",
  "over",
]);

const serviceStartedAt = new Date().toISOString();
const MULTIPLAYER_HISTORY_RETENTION = {
  mode: "process-memory",
  survivesServiceRestart: false,
} as const;

export interface MultiplayerGameRecord {
  id: string;
  name: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  game: Game;
  players: MultiplayerPlayerAssignments;
  completion: MultiplayerCompletion | null;
  historyEvents: MultiplayerGameEvent[];
}

export interface MultiplayerService {
  app: Express;
  gameStore: InMemoryMultiplayerGameStore;
  websocketHub: MultiplayerWebSocketHub;
}

type MultiplayerGameEventInput =
  | Omit<Extract<MultiplayerGameEvent, { type: "game-created" }>, "sequence">
  | Omit<Extract<MultiplayerGameEvent, { type: "player-joined" }>, "sequence">
  | Omit<Extract<MultiplayerGameEvent, { type: "game-completed" }>, "sequence">;

export function toGameSummary(game: MultiplayerGameRecord): MultiplayerGameSummary {
  const openSeatCount = game.players.O === null ? 1 : 0;

  return {
    id: game.id,
    name: game.name,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    hostName: game.players.X.name ?? "Player X",
    openSeatCount,
  };
}

export function toGameSnapshot(game: MultiplayerGameRecord): MultiplayerGameSnapshot {
  const state = game.game.getState();
  const snapshotState =
    game.completion === null
      ? state
      : {
          ...state,
          status: {
            winner: game.completion.winner,
            isDraw: game.completion.endReason === "draw",
            isOver: true,
          },
        };

  return {
    ...toGameSummary(game),
    players: {
      X: { ...game.players.X },
      O: game.players.O ? { ...game.players.O } : null,
    },
    state: snapshotState,
    completion: game.completion ? { ...game.completion } : null,
    history: {
      retention: MULTIPLAYER_HISTORY_RETENTION,
      events: game.historyEvents.map((event) => {
        if (event.type === "game-completed") {
          return {
            ...event,
            completion: { ...event.completion },
          };
        }

        return { ...event };
      }),
    },
  };
}

function createPlayerSession(
  gameId: string,
  player: Player
): MultiplayerPlayerSession {
  return {
    gameId,
    role: "player",
    player,
    mode: "multiplayer",
  };
}

function hasAssignedPlayer(game: MultiplayerGameRecord, player: Player): boolean {
  return player === "X" ? true : game.players.O !== null;
}

function getOpponent(player: Player): Player {
  return player === "X" ? "O" : "X";
}

export function createCompletionFromCurrentGame(
  game: MultiplayerGameRecord,
  completedAt: string
): MultiplayerCompletion | null {
  const status = game.game.getStatus();

  if (!status.isOver) {
    return null;
  }

  if (status.winner === null) {
    return {
      endReason: "draw",
      winner: null,
      loser: null,
      completedAt,
    };
  }

  return {
    endReason: "win",
    winner: status.winner,
    loser: getOpponent(status.winner),
    completedAt,
  };
}

export function appendHistoryEvent(
  game: MultiplayerGameRecord,
  event: MultiplayerGameEventInput
) {
  game.historyEvents.push({
    ...event,
    sequence: game.historyEvents.length + 1,
  } as MultiplayerGameEvent);
}

function normalizeModalTextInput(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCreateGameRequest(
  payload: unknown
):
  | { playerName: string; gameName: string }
  | { message: string } {
  const request = payload as Partial<CreateGameRequest> | null;
  const playerName = normalizeModalTextInput(request?.playerName);
  const gameName = normalizeModalTextInput(request?.gameName);

  if (playerName.length === 0) {
    return { message: "Enter your player name to host a multiplayer game." };
  }

  if (gameName.length === 0) {
    return { message: "Enter a game name to create a multiplayer game." };
  }

  if (playerName.length > MULTIPLAYER_PLAYER_NAME_MAX_LENGTH) {
    return {
      message: `Player name must be ${MULTIPLAYER_PLAYER_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (gameName.length > MULTIPLAYER_GAME_NAME_MAX_LENGTH) {
    return {
      message: `Game name must be ${MULTIPLAYER_GAME_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { playerName, gameName };
}

function createWebSocketAcceptKey(key: string): string {
  return createHash("sha1").update(`${key}${WS_MAGIC_GUID}`).digest("base64");
}

function encodeWebSocketFrame(message: string): Buffer {
  const payload = Buffer.from(message, "utf8");

  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  }

  if (payload.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, payload]);
}

function sendUpgradeError(socket: Socket, statusCode: number, message: string) {
  socket.write(
    `HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
  );
  socket.destroy();
}

class MultiplayerWebSocketHub {
  private readonly subscriptions = new Map<string, Set<Socket>>();

  private send(socket: Socket, event: MultiplayerServerEvent) {
    if (socket.destroyed) {
      return;
    }

    socket.write(encodeWebSocketFrame(JSON.stringify(event)));
  }

  subscribe(gameId: string, socket: Socket) {
    const existingSockets = this.subscriptions.get(gameId) ?? new Set<Socket>();
    existingSockets.add(socket);
    this.subscriptions.set(gameId, existingSockets);
  }

  unsubscribe(gameId: string, socket: Socket) {
    const existingSockets = this.subscriptions.get(gameId);

    if (!existingSockets) {
      return;
    }

    existingSockets.delete(socket);
    if (existingSockets.size === 0) {
      this.subscriptions.delete(gameId);
    }
  }

  publish(gameId: string, event: MultiplayerServerEvent) {
    const sockets = this.subscriptions.get(gameId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    for (const socket of sockets) {
      if (socket.destroyed) {
        this.unsubscribe(gameId, socket);
        continue;
      }

      this.send(socket, event);
    }
  }

  publishToSocket(socket: Socket, event: MultiplayerServerEvent) {
    this.send(socket, event);
  }
}

export class InMemoryMultiplayerGameStore {
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

  createWaitingGame(playerName: string, gameName: string): MultiplayerGameRecord {
    const timestamp = new Date().toISOString();
    const game: MultiplayerGameRecord = {
      id: randomUUID(),
      name: gameName,
      status: "waiting",
      createdAt: timestamp,
      updatedAt: timestamp,
      game: new Game(),
      players: {
        X: {
          player: "X",
          name: playerName,
          joinedAt: timestamp,
        },
        O: null,
      },
      completion: null,
      historyEvents: [],
    };

    appendHistoryEvent(game, {
      type: "game-created",
      occurredAt: timestamp,
      player: "X",
    });

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
    appendHistoryEvent(game, {
      type: "player-joined",
      occurredAt: timestamp,
      player: "O",
    });

    return game;
  }

  submitMove(
    id: string,
    player: Player,
    position: number
  ):
    | MultiplayerGameRecord
    | "not_found"
    | "not_active"
    | "player_not_joined"
    | "wrong_turn"
    | "invalid_move" {
    const game = this.games.get(id);

    if (!game) {
      return "not_found";
    }

    if (game.status !== "active") {
      return "not_active";
    }

    if (!hasAssignedPlayer(game, player)) {
      return "player_not_joined";
    }

    if (game.game.getCurrentPlayer() !== player) {
      return "wrong_turn";
    }

    if (!game.game.canPlaceMove(position)) {
      return "invalid_move";
    }

    const didPlaceMove = game.game.placeMove(position);

    if (!didPlaceMove) {
      return "invalid_move";
    }

    game.updatedAt = new Date().toISOString();
    if (game.game.getStatus().isOver) {
      game.status = "over";
      game.completion = createCompletionFromCurrentGame(game, game.updatedAt);
      if (game.completion !== null) {
        appendHistoryEvent(game, {
          type: "game-completed",
          occurredAt: game.updatedAt,
          completion: game.completion,
        });
      }
    }

    return game;
  }

  resignGame(
    id: string,
    player: Player
  ):
    | MultiplayerGameRecord
    | "not_found"
    | "not_active"
    | "player_not_joined" {
    const game = this.games.get(id);

    if (!game) {
      return "not_found";
    }

    if (game.status !== "active") {
      return "not_active";
    }

    if (!hasAssignedPlayer(game, player)) {
      return "player_not_joined";
    }

    const completedAt = new Date().toISOString();
    game.status = "over";
    game.updatedAt = completedAt;
    game.completion = {
      endReason: "resignation",
      winner: getOpponent(player),
      loser: player,
      completedAt,
    };
    appendHistoryEvent(game, {
      type: "game-completed",
      occurredAt: completedAt,
      completion: game.completion,
    });

    return game;
  }
}

function createConnectionReadyEvent(
  game: MultiplayerGameRecord
): MultiplayerConnectionReadyEvent {
  return {
    type: "connection-ready",
    game: toGameSnapshot(game),
  };
}

function createResyncNeededEvent(
  game: MultiplayerGameRecord,
  reason: MultiplayerResyncNeededEvent["reason"]
): MultiplayerResyncNeededEvent {
  return {
    type: "resync-needed",
    game: toGameSnapshot(game),
    reason,
  };
}

function createMoveAppliedEvent(
  game: MultiplayerGameRecord,
  player: Player,
  position: number
): MultiplayerMoveAppliedEvent {
  return {
    type: "move-applied",
    game: toGameSnapshot(game),
    move: {
      player,
      position,
    },
  };
}

function createGameOverEvent(game: MultiplayerGameRecord): MultiplayerGameOverEvent {
  return {
    type: "game-over",
    game: toGameSnapshot(game),
  };
}

function createResignedEvent(
  game: MultiplayerGameRecord,
  resignedPlayer: Player
): MultiplayerResignedEvent {
  return {
    type: "resigned",
    game: toGameSnapshot(game),
    resignedPlayer,
  };
}

function attachWebSocketServer(server: HttpServer, service: MultiplayerService) {
  server.on("upgrade", (request, rawSocket) => {
    const socket = rawSocket as Socket;
    const requestUrl = request.url ? new URL(request.url, "http://localhost") : null;

    if (!requestUrl || requestUrl.pathname !== "/ws") {
      sendUpgradeError(socket, 404, "Not Found");
      return;
    }

    const gameId = requestUrl.searchParams.get("gameId");
    const upgradeHeader = request.headers.upgrade;
    const connectionHeader = request.headers.connection;
    const websocketKey = request.headers["sec-websocket-key"];

    if (!gameId) {
      sendUpgradeError(socket, 400, "Bad Request");
      return;
    }

    const game = service.gameStore.get(gameId);
    if (!game) {
      sendUpgradeError(socket, 404, "Not Found");
      return;
    }

    if (
      upgradeHeader?.toLowerCase() !== "websocket" ||
      !connectionHeader?.toLowerCase().includes("upgrade") ||
      typeof websocketKey !== "string"
    ) {
      sendUpgradeError(socket, 400, "Bad Request");
      return;
    }

    const acceptKey = createWebSocketAcceptKey(websocketKey);
    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptKey}`,
        "\r\n",
      ].join("\r\n")
    );

    service.websocketHub.subscribe(gameId, socket);
    service.websocketHub.publishToSocket(socket, createConnectionReadyEvent(game));

    socket.on("close", () => {
      service.websocketHub.unsubscribe(gameId, socket);
    });

    socket.on("error", () => {
      service.websocketHub.unsubscribe(gameId, socket);
    });

    socket.on("end", () => {
      service.websocketHub.unsubscribe(gameId, socket);
    });

    socket.on("data", (chunk: Buffer) => {
      const opcode = chunk[0] & 0x0f;

      if (opcode === 0x8) {
        service.websocketHub.unsubscribe(gameId, socket);
        socket.end();
      }
    });
  });
}

export function createMultiplayerApp(): MultiplayerService {
  const app = express();
  const gameStore = new InMemoryMultiplayerGameStore();
  const websocketHub = new MultiplayerWebSocketHub();

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

  app.post("/games", (request, response) => {
    response.setHeader("cache-control", "no-store");

    if (gameStore.getConcurrentGameCount() >= MAX_CONCURRENT_GAMES) {
      response.status(429).json({
        status: "capacity_reached",
        message: "The multiplayer service is at capacity. Try again later.",
        maxConcurrentGames: MAX_CONCURRENT_GAMES,
      });
      return;
    }

    const validationResult = validateCreateGameRequest(request.body);
    if ("message" in validationResult) {
      response.status(400).json({
        status: "invalid_request",
        message: validationResult.message,
      });
      return;
    }

    const game = gameStore.createWaitingGame(
      validationResult.playerName,
      validationResult.gameName
    );
    const payload: CreateGameResponse = {
      game: toGameSnapshot(game),
      joinCode: game.id,
      session: createPlayerSession(game.id, "X"),
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

    websocketHub.publish(
      result.id,
      createResyncNeededEvent(result, "player-joined")
    );

    const payload: JoinGameResponse = {
      game: toGameSnapshot(result),
      session: createPlayerSession(result.id, "O"),
    };

    response.status(200).json(payload);
  });

  app.post("/games/:id/moves", (request, response) => {
    response.setHeader("cache-control", "no-store");

    const { player, position } = (request.body ?? {}) as Partial<MultiplayerMoveRequest>;

    if ((player !== "X" && player !== "O") || !Number.isInteger(position)) {
      response.status(400).json({
        status: "invalid_move_request",
        message: "Move requests must include a valid player and integer board position.",
      });
      return;
    }

    const result = gameStore.submitMove(request.params.id, player, position as number);

    if (result === "not_found") {
      response.status(404).json({
        status: "not_found",
        message: "Game not found.",
      });
      return;
    }

    if (result === "not_active") {
      response.status(409).json({
        status: "not_active",
        message: "Moves are only accepted for active multiplayer games.",
      });
      return;
    }

    if (result === "player_not_joined") {
      response.status(409).json({
        status: "player_not_joined",
        message: "That player is not assigned to this game.",
      });
      return;
    }

    if (result === "wrong_turn") {
      response.status(409).json({
        status: "wrong_turn",
        message: "It is not that player's turn.",
      });
      return;
    }

    if (result === "invalid_move") {
      response.status(409).json({
        status: "invalid_move",
        message: "That move is not allowed for the current game state.",
      });
      return;
    }

    websocketHub.publish(
      result.id,
      createMoveAppliedEvent(result, player, position as number)
    );

    if (result.status === "over") {
      websocketHub.publish(result.id, createGameOverEvent(result));
    }

    const payload: SubmitMoveResponse = {
      game: toGameSnapshot(result),
    };

    response.status(200).json(payload);
  });

  app.post("/games/:id/resign", (request, response) => {
    response.setHeader("cache-control", "no-store");

    const { player } = (request.body ?? {}) as Partial<ResignGameRequest>;

    if (player !== "X" && player !== "O") {
      response.status(400).json({
        status: "invalid_resign_request",
        message: "Resign requests must include a valid player.",
      });
      return;
    }

    const result = gameStore.resignGame(request.params.id, player);

    if (result === "not_found") {
      response.status(404).json({
        status: "not_found",
        message: "Game not found.",
      });
      return;
    }

    if (result === "not_active") {
      response.status(409).json({
        status: "not_active",
        message: "Only active multiplayer games can be resigned.",
      });
      return;
    }

    if (result === "player_not_joined") {
      response.status(409).json({
        status: "player_not_joined",
        message: "That player is not assigned to this game.",
      });
      return;
    }

    websocketHub.publish(result.id, createResignedEvent(result, player));
    websocketHub.publish(result.id, createGameOverEvent(result));

    const payload: ResignGameResponse = {
      game: toGameSnapshot(result),
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

  return {
    app,
    gameStore,
    websocketHub,
  };
}

export function startMultiplayerServer() {
  const parsedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);
  const port = Number.isNaN(parsedPort) ? DEFAULT_PORT : parsedPort;
  const host = process.env.HOST ?? DEFAULT_HOST;
  const service = createMultiplayerApp();
  const server = createServer(service.app);

  attachWebSocketServer(server, service);

  server.listen(port, host, () => {
    console.log(`Multiplayer service listening on http://${host}:${port}`);
  });

  return server;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  startMultiplayerServer();
}
