import {
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { MultiplayerEvent, MultiplayerGame, MultiplayerGameStatus } from '../domain/types.js';
import {
  fromConnectionItem,
  fromEventItem,
  fromGameItem,
  toConnectionItem,
  toEventItem,
  toGameItem,
  toGameSummary,
} from './dynamoDbMappers.js';
import type {
  BackendTableNames,
  ConnectionRecord,
  ConnectionsRepository,
  GameEventsRepository,
  GamesRepository,
  GameSummary,
} from './types.js';

const STATUS_CREATED_AT_INDEX = 'status-createdAt-index';

function assertNoUnprocessedItems(result: { UnprocessedItems?: Record<string, unknown> }): void {
  if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
    throw new Error('DynamoDB batch write returned unprocessed items.');
  }
}

export class DynamoDbGamesRepository implements GamesRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableNames: BackendTableNames,
  ) {}

  async save(game: MultiplayerGame): Promise<void> {
    await this.documentClient.send(
      new PutCommand({
        TableName: this.tableNames.gamesTableName,
        Item: toGameItem(game),
      }),
    );
  }

  async getById(gameId: string): Promise<MultiplayerGame | null> {
    const result = await this.documentClient.send(
      new GetCommand({
        TableName: this.tableNames.gamesTableName,
        Key: { gameId },
      }),
    );

    return fromGameItem(result.Item as ReturnType<typeof toGameItem> | undefined);
  }

  async listByStatus(status: MultiplayerGameStatus): Promise<GameSummary[]> {
    const result = await this.documentClient.send(
      new QueryCommand({
        TableName: this.tableNames.gamesTableName,
        IndexName: STATUS_CREATED_AT_INDEX,
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
      }),
    );

    return (result.Items ?? []).map((item) =>
      toGameSummary(item as ReturnType<typeof toGameItem>),
    );
  }

  async countByStatuses(statuses: MultiplayerGameStatus[]): Promise<number> {
    const counts = await Promise.all(statuses.map((status) => this.listByStatus(status)));

    return counts.reduce((total, games) => total + games.length, 0);
  }
}

export class DynamoDbGameEventsRepository implements GameEventsRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableNames: BackendTableNames,
  ) {}

  async append(gameId: string, events: MultiplayerEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const result = await this.documentClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [this.tableNames.gameEventsTableName]: events.map((event) => ({
            PutRequest: {
              Item: toEventItem(gameId, event),
            },
          })),
        },
      }),
    );

    assertNoUnprocessedItems(result);
  }

  async listByGameId(gameId: string): Promise<MultiplayerEvent[]> {
    const result = await this.documentClient.send(
      new QueryCommand({
        TableName: this.tableNames.gameEventsTableName,
        KeyConditionExpression: 'gameId = :gameId',
        ExpressionAttributeValues: {
          ':gameId': gameId,
        },
        ScanIndexForward: true,
      }),
    );

    return (result.Items ?? []).map((item) =>
      fromEventItem(item as ReturnType<typeof toEventItem>),
    );
  }
}

export class DynamoDbConnectionsRepository implements ConnectionsRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableNames: BackendTableNames,
  ) {}

  async put(record: ConnectionRecord): Promise<void> {
    await this.documentClient.send(
      new PutCommand({
        TableName: this.tableNames.connectionsTableName,
        Item: toConnectionItem(record),
      }),
    );
  }

  async delete(gameId: string, connectionId: string): Promise<void> {
    await this.documentClient.send(
      new DeleteCommand({
        TableName: this.tableNames.connectionsTableName,
        Key: {
          gameId,
          connectionId,
        },
      }),
    );
  }

  async listByGameId(gameId: string): Promise<ConnectionRecord[]> {
    const result = await this.documentClient.send(
      new QueryCommand({
        TableName: this.tableNames.connectionsTableName,
        KeyConditionExpression: 'gameId = :gameId',
        ExpressionAttributeValues: {
          ':gameId': gameId,
        },
      }),
    );

    return (result.Items ?? []).map((item) =>
      fromConnectionItem(item as ReturnType<typeof toConnectionItem>),
    );
  }

  async findByConnectionId(connectionId: string): Promise<ConnectionRecord | null> {
    const result = await this.documentClient.send(
      new ScanCommand({
        TableName: this.tableNames.connectionsTableName,
        FilterExpression: 'connectionId = :connectionId',
        ExpressionAttributeValues: {
          ':connectionId': connectionId,
        },
        Limit: 1,
      }),
    );

    const item = result.Items?.[0];

    return item
      ? fromConnectionItem(item as ReturnType<typeof toConnectionItem>)
      : null;
  }
}
