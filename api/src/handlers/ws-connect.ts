import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { nowIso } from "../domain.js";
import { createConnection } from "../store.js";

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  if (connectionId === undefined) {
    return { statusCode: 400 };
  }

  await createConnection(connectionId, nowIso());
  return { statusCode: 200 };
};
