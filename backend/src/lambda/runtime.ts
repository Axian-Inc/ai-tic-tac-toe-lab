import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayWebSocketPublisher, broadcastGameEvents } from '../websocket/broadcaster.js';
import {
  DynamoDbConnectionsRepository,
  DynamoDbGameEventsRepository,
  DynamoDbGamesRepository,
} from '../repositories/dynamoDbRepositories.js';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const dynamoDbClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const tableNames = {
  gamesTableName: requireEnv('GAMES_TABLE_NAME'),
  gameEventsTableName: requireEnv('GAME_EVENTS_TABLE_NAME'),
  connectionsTableName: requireEnv('CONNECTIONS_TABLE_NAME'),
};

const gamesRepository = new DynamoDbGamesRepository(documentClient, tableNames);
const gameEventsRepository = new DynamoDbGameEventsRepository(documentClient, tableNames);
const connectionsRepository = new DynamoDbConnectionsRepository(documentClient, tableNames);

const frontendBaseUrl = process.env.FRONTEND_BASE_URL;
const webSocketManagementEndpoint = process.env.WEBSOCKET_MANAGEMENT_ENDPOINT;

const webSocketPublisher = webSocketManagementEndpoint
  ? new ApiGatewayWebSocketPublisher(webSocketManagementEndpoint)
  : null;

export function getHttpDependencies() {
  return {
    frontendBaseUrl,
    broadcastEvents: webSocketPublisher
      ? (gameId: string, events: Parameters<typeof broadcastGameEvents>[3]) =>
          broadcastGameEvents(connectionsRepository, webSocketPublisher, gameId, events)
      : async () => {},
  };
}

export function getRepositories() {
  return {
    gamesRepository,
    gameEventsRepository,
    connectionsRepository,
  };
}
