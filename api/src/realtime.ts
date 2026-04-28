import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import type { GameEvent } from "./contracts.js";
import { config } from "./config.js";
import { deleteConnection, listConnectionsByGame } from "./store.js";

const makeClient = (endpoint: string): ApiGatewayManagementApiClient =>
  new ApiGatewayManagementApiClient({ endpoint });

export const websocketEndpointFromEvent = (
  event: APIGatewayProxyWebsocketEventV2,
): string => {
  const configuredEndpoint = config.websocketCallbackEndpoint();
  if (configuredEndpoint !== undefined) {
    return configuredEndpoint;
  }

  return `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
};

export const postToConnection = async (
  endpoint: string,
  connectionId: string,
  message: unknown,
): Promise<void> => {
  const client = makeClient(endpoint);

  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(message)),
      }),
    );
  } catch (error) {
    if (error instanceof GoneException) {
      await deleteConnection(connectionId);
      return;
    }

    throw error;
  }
};

export const broadcastEvents = async (gameId: string, events: GameEvent[]): Promise<void> => {
  if (events.length === 0) {
    return;
  }

  const endpoint = config.websocketCallbackEndpoint();
  if (endpoint === undefined) {
    console.warn("Skipping WebSocket broadcast because WEBSOCKET_CALLBACK_ENDPOINT is not set.");
    return;
  }

  const connections = await listConnectionsByGame(gameId);
  await Promise.all(
    connections.flatMap((connection) =>
      events.map((event) => postToConnection(endpoint, connection.connectionId, event)),
    ),
  );
};
