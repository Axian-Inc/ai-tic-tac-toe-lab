import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  applyMove,
  checkAbandonment,
  createGame,
  getSeatForToken,
  joinGame,
  resignGame,
  toPublicGame,
  validateCellIndex,
  validateDisplayName,
} from "../domain.js";
import { ApiError } from "../errors.js";
import { broadcastEvents } from "../realtime.js";
import {
  errorResponse,
  getStringProperty,
  handleError,
  jsonResponse,
  parseJsonBody,
  routeNotFound,
} from "../http-response.js";
import {
  createGameRecord,
  getEvents,
  getGame,
  getGameAndEvents,
  saveGameMutation,
} from "../store.js";

type RouteMatch = {
  gameId: string;
  action?: string;
};

const normalizePath = (path: string): string => path.replace(/\/+$/, "") || "/";

const matchGameRoute = (path: string): RouteMatch | null => {
  const match = /^\/api\/games\/([^/]+)(?:\/([^/]+))?$/.exec(path);
  if (match === null) {
    return null;
  }

  return {
    gameId: decodeURIComponent(match[1]),
    action: match[2],
  };
};

const parseAfterSequence = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ApiError(400, "BAD_REQUEST", "afterSequence must be a non-negative integer.");
  }

  return parsed;
};

const handleCreateGame = async (event: APIGatewayProxyEventV2) => {
  const body = parseJsonBody(event.body);
  const displayName = validateDisplayName(getStringProperty(body, "displayName"));
  const { game, player, event: createdEvent } = createGame(displayName);
  await createGameRecord(game, createdEvent);

  return jsonResponse(201, {
    game: toPublicGame(game, [createdEvent]),
    player,
  });
};

const handleJoinGame = async (event: APIGatewayProxyEventV2, gameId: string) => {
  const body = parseJsonBody(event.body);
  const displayName = validateDisplayName(getStringProperty(body, "displayName"));
  const previousGame = await getGame(gameId);
  const { game, player, event: joinedEvent } = joinGame(previousGame, displayName);
  await saveGameMutation(previousGame, game, [joinedEvent]);
  await broadcastEvents(game.id, [joinedEvent]);
  const events = await getEvents(game.id);

  return jsonResponse(200, {
    game: toPublicGame(game, events),
    player,
  });
};

const handleGetGame = async (gameId: string) => {
  const { game, events } = await getGameAndEvents(gameId);

  return jsonResponse(200, {
    game: toPublicGame(game, events),
  });
};

const handleGetEvents = async (event: APIGatewayProxyEventV2, gameId: string) => {
  await getGame(gameId);
  const afterSequence = parseAfterSequence(event.queryStringParameters?.afterSequence);
  const events = await getEvents(gameId, afterSequence);

  return jsonResponse(200, {
    events,
  });
};

const handleMove = async (event: APIGatewayProxyEventV2, gameId: string) => {
  const body = parseJsonBody(event.body);
  const previousGame = await getGame(gameId);
  const seat = getSeatForToken(previousGame, getStringProperty(body, "playerToken"));
  const cellIndex = validateCellIndex(getStringProperty(body, "cellIndex"));
  const { game, events, move } = applyMove(previousGame, seat, cellIndex);
  await saveGameMutation(previousGame, game, events);
  await broadcastEvents(game.id, events);
  const eventHistory = await getEvents(game.id);

  return jsonResponse(200, {
    accepted: true,
    game: toPublicGame(game, eventHistory),
    move,
  });
};

const handleResign = async (event: APIGatewayProxyEventV2, gameId: string) => {
  const body = parseJsonBody(event.body);
  const previousGame = await getGame(gameId);
  const seat = getSeatForToken(previousGame, getStringProperty(body, "playerToken"));
  const { game, events } = resignGame(previousGame, seat);
  await saveGameMutation(previousGame, game, events);
  await broadcastEvents(game.id, events);
  const eventHistory = await getEvents(game.id);

  return jsonResponse(200, {
    game: toPublicGame(game, eventHistory),
  });
};

const handleAbandonmentCheck = async (event: APIGatewayProxyEventV2, gameId: string) => {
  const body = parseJsonBody(event.body);
  const previousGame = await getGame(gameId);
  getSeatForToken(previousGame, getStringProperty(body, "playerToken"));
  const { game, events, abandoned } = checkAbandonment(previousGame);

  if (abandoned) {
    await saveGameMutation(previousGame, game, events);
    await broadcastEvents(game.id, events);
  }

  const eventHistory = await getEvents(game.id);

  return jsonResponse(200, {
    abandoned,
    game: toPublicGame(game, eventHistory),
  });
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (event.requestContext.http.method === "OPTIONS") {
      return jsonResponse(204, {});
    }

    const method = event.requestContext.http.method;
    const path = normalizePath(event.rawPath);

    if (method === "GET" && path === "/api/health") {
      return jsonResponse(200, { status: "ok" });
    }

    if (method === "POST" && path === "/api/games") {
      return await handleCreateGame(event);
    }

    const gameRoute = matchGameRoute(path);
    if (gameRoute === null) {
      return routeNotFound();
    }

    if (method === "GET" && gameRoute.action === undefined) {
      return await handleGetGame(gameRoute.gameId);
    }

    if (method === "GET" && gameRoute.action === "events") {
      return await handleGetEvents(event, gameRoute.gameId);
    }

    if (method === "POST" && gameRoute.action === "join") {
      return await handleJoinGame(event, gameRoute.gameId);
    }

    if (method === "POST" && gameRoute.action === "moves") {
      return await handleMove(event, gameRoute.gameId);
    }

    if (method === "POST" && gameRoute.action === "resign") {
      return await handleResign(event, gameRoute.gameId);
    }

    if (method === "POST" && gameRoute.action === "abandonment-check") {
      return await handleAbandonmentCheck(event, gameRoute.gameId);
    }

    return routeNotFound();
  } catch (error) {
    return handleError(error);
  }
};
