import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { validateDisplayName, getSeatForToken } from "../domain.js";
import { ApiError } from "../errors.js";
import { postToConnection, websocketEndpointFromEvent } from "../realtime.js";
import { getGame, subscribeConnection } from "../store.js";

const parseMessage = (body: string | null | undefined): Record<string, unknown> => {
  if (body === null || body === undefined || body.length === 0) {
    throw new ApiError(400, "BAD_REQUEST", "WebSocket message body is required.");
  }

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Message must be an object.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "WebSocket message body must be valid JSON.");
  }
};

const getString = (message: Record<string, unknown>, key: string): string | undefined =>
  typeof message[key] === "string" ? (message[key] as string) : undefined;

const send = async (
  event: APIGatewayProxyWebsocketEventV2,
  message: unknown,
): Promise<void> => {
  const connectionId = event.requestContext.connectionId;
  if (connectionId === undefined) {
    return;
  }

  await postToConnection(websocketEndpointFromEvent(event), connectionId, message);
};

const handleSubscribe = async (
  event: APIGatewayProxyWebsocketEventV2,
  message: Record<string, unknown>,
): Promise<void> => {
  const connectionId = event.requestContext.connectionId;
  const gameId = getString(message, "gameId");
  const role = getString(message, "role");

  if (connectionId === undefined || gameId === undefined) {
    throw new ApiError(400, "BAD_REQUEST", "Subscribe message requires gameId.");
  }

  if (role !== "player" && role !== "spectator") {
    throw new ApiError(400, "BAD_REQUEST", "Subscribe role must be player or spectator.");
  }

  const game = await getGame(gameId);
  const expiresAt = Math.floor(Date.now() / 1000) + 86_400;

  if (role === "player") {
    const seat = getSeatForToken(game, message.playerToken);
    await subscribeConnection({
      connectionId,
      connectedAt: "",
      expiresAt,
      gameId,
      role,
      displayName: seat.displayName,
      playerMark: seat.mark,
    });
    await send(event, {
      type: "subscription.confirmed",
      gameId,
      role,
      playerMark: seat.mark,
      latestSequence: game.latestSequence,
    });
    return;
  }

  const displayName = validateDisplayName(message.displayName);
  await subscribeConnection({
    connectionId,
    connectedAt: "",
    expiresAt,
    gameId,
    role,
    displayName,
  });
  await send(event, {
    type: "subscription.confirmed",
    gameId,
    role,
    latestSequence: game.latestSequence,
  });
};

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const message = parseMessage(event.body);
    if (message.type !== "subscribe") {
      throw new ApiError(400, "BAD_REQUEST", "Unsupported WebSocket message type.");
    }

    await handleSubscribe(event, message);
    return { statusCode: 200 };
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(500, "INTERNAL_ERROR", "Internal server error.");

    if (!(error instanceof ApiError)) {
      console.error(error);
    }

    await send(event, {
      type: "error",
      error: {
        code: apiError.code,
        message: apiError.message,
      },
    });

    return { statusCode: 200 };
  }
};
