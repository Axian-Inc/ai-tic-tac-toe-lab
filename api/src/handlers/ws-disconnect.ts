import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { deleteConnection } from "../store.js";

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  if (connectionId !== undefined) {
    await deleteConnection(connectionId);
  }

  return { statusCode: 200 };
};
