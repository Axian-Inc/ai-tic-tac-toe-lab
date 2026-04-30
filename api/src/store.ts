import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ConnectionRecord, GameEvent, StoredGame } from "./contracts.js";
import { config } from "./config.js";
import { ApiError, notFound } from "./errors.js";
import { isConcurrentGameState, MAX_CONCURRENT_GAMES } from "./domain.js";

const client = new DynamoDBClient({});

export const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const CONCURRENT_COUNTER_ID = "concurrent-games";

const isConditionalFailure = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name: string }).name === "TransactionCanceledException";

export const getGame = async (gameId: string): Promise<StoredGame> => {
  const result = await documentClient.send(
    new GetCommand({
      TableName: config.gamesTableName(),
      Key: { id: gameId },
    }),
  );

  if (result.Item === undefined) {
    throw notFound("Game not found.");
  }

  return result.Item as StoredGame;
};

export const getEvents = async (gameId: string, afterSequence?: number): Promise<GameEvent[]> => {
  const hasAfterSequence = afterSequence !== undefined;
  const result = await documentClient.send(
    new QueryCommand({
      TableName: config.eventsTableName(),
      KeyConditionExpression: hasAfterSequence
        ? "gameId = :gameId AND #sequence > :afterSequence"
        : "gameId = :gameId",
      ExpressionAttributeNames: hasAfterSequence ? { "#sequence": "sequence" } : undefined,
      ExpressionAttributeValues: hasAfterSequence
        ? { ":gameId": gameId, ":afterSequence": afterSequence }
        : { ":gameId": gameId },
      ScanIndexForward: true,
    }),
  );

  return (result.Items ?? []) as GameEvent[];
};

export const getGameAndEvents = async (
  gameId: string,
): Promise<{ game: StoredGame; events: GameEvent[] }> => {
  const game = await getGame(gameId);
  const events = await getEvents(gameId);
  return { game, events };
};

const listGamesByState = async (state: StoredGame["state"]): Promise<StoredGame[]> => {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: config.gamesTableName(),
      IndexName: config.gamesStateIndexName(),
      KeyConditionExpression: "#state = :state",
      ExpressionAttributeNames: {
        "#state": "state",
      },
      ExpressionAttributeValues: {
        ":state": state,
      },
      ScanIndexForward: false,
    }),
  );

  return (result.Items ?? []) as StoredGame[];
};

export const listInProgressGames = async (): Promise<StoredGame[]> => {
  const [waitingGames, activeGames] = await Promise.all([
    listGamesByState("waiting_for_players"),
    listGamesByState("active"),
  ]);

  return [...waitingGames, ...activeGames];
};

export const createGameRecord = async (game: StoredGame, event: GameEvent): Promise<void> => {
  try {
    await documentClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: config.gamesTableName(),
              Item: game,
              ConditionExpression: "attribute_not_exists(id)",
            },
          },
          {
            Put: {
              TableName: config.eventsTableName(),
              Item: event,
              ConditionExpression: "attribute_not_exists(gameId) AND attribute_not_exists(#sequence)",
              ExpressionAttributeNames: {
                "#sequence": "sequence",
              },
            },
          },
          {
            Update: {
              TableName: config.countersTableName(),
              Key: { id: CONCURRENT_COUNTER_ID },
              UpdateExpression: "SET #count = if_not_exists(#count, :zero) + :one",
              ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
              ExpressionAttributeNames: {
                "#count": "count",
              },
              ExpressionAttributeValues: {
                ":zero": 0,
                ":one": 1,
                ":limit": MAX_CONCURRENT_GAMES,
              },
            },
          },
        ],
      }),
    );
  } catch (error) {
    if (isConditionalFailure(error)) {
      throw new ApiError(429, "GAME_LIMIT_REACHED", "Maximum concurrent game limit reached.");
    }

    throw error;
  }
};

export const saveGameMutation = async (
  previousGame: StoredGame,
  nextGame: StoredGame,
  events: GameEvent[],
): Promise<void> => {
  const shouldDecrementCounter =
    isConcurrentGameState(previousGame.state) && !isConcurrentGameState(nextGame.state);

  try {
    await documentClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: config.gamesTableName(),
              Item: nextGame,
              ConditionExpression:
                "id = :gameId AND #latestSequence = :previousSequence AND #state = :previousState",
              ExpressionAttributeNames: {
                "#latestSequence": "latestSequence",
                "#state": "state",
              },
              ExpressionAttributeValues: {
                ":gameId": previousGame.id,
                ":previousSequence": previousGame.latestSequence,
                ":previousState": previousGame.state,
              },
            },
          },
          ...events.map((event) => ({
            Put: {
              TableName: config.eventsTableName(),
              Item: event,
              ConditionExpression: "attribute_not_exists(gameId) AND attribute_not_exists(#sequence)",
              ExpressionAttributeNames: {
                "#sequence": "sequence",
              },
            },
          })),
          ...(shouldDecrementCounter
            ? [
                {
                  Update: {
                    TableName: config.countersTableName(),
                    Key: { id: CONCURRENT_COUNTER_ID },
                    UpdateExpression: "SET #count = #count - :one",
                    ConditionExpression: "#count > :zero",
                    ExpressionAttributeNames: {
                      "#count": "count",
                    },
                    ExpressionAttributeValues: {
                      ":one": 1,
                      ":zero": 0,
                    },
                  },
                },
              ]
            : []),
        ],
      }),
    );
  } catch (error) {
    if (isConditionalFailure(error)) {
      throw new ApiError(409, "GAME_NOT_ACTIVE", "Game changed while processing the request.");
    }

    throw error;
  }
};

export const createConnection = async (connectionId: string, connectedAt: string): Promise<void> => {
  await documentClient.send(
    new PutCommand({
      TableName: config.connectionsTableName(),
      Item: {
        connectionId,
        connectedAt,
        expiresAt: Math.floor(Date.now() / 1000) + 86_400,
      } satisfies ConnectionRecord,
    }),
  );
};

export const deleteConnection = async (connectionId: string): Promise<void> => {
  await documentClient.send(
    new DeleteCommand({
      TableName: config.connectionsTableName(),
      Key: { connectionId },
    }),
  );
};

export const subscribeConnection = async (connection: ConnectionRecord): Promise<void> => {
  const hasPlayerMark = connection.playerMark !== undefined;
  await documentClient.send(
    new UpdateCommand({
      TableName: config.connectionsTableName(),
      Key: { connectionId: connection.connectionId },
      UpdateExpression: hasPlayerMark
        ? "SET gameId = :gameId, #role = :role, displayName = :displayName, playerMark = :playerMark, expiresAt = :expiresAt"
        : "SET gameId = :gameId, #role = :role, displayName = :displayName, expiresAt = :expiresAt REMOVE playerMark",
      ExpressionAttributeNames: {
        "#role": "role",
      },
      ExpressionAttributeValues: {
        ":gameId": connection.gameId,
        ":role": connection.role,
        ":displayName": connection.displayName,
        ":expiresAt": connection.expiresAt,
        ...(hasPlayerMark ? { ":playerMark": connection.playerMark } : {}),
      },
    }),
  );
};

export const listConnectionsByGame = async (gameId: string): Promise<ConnectionRecord[]> => {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: config.connectionsTableName(),
      IndexName: config.connectionsGameIndexName(),
      KeyConditionExpression: "gameId = :gameId",
      ExpressionAttributeValues: {
        ":gameId": gameId,
      },
    }),
  );

  return (result.Items ?? []) as ConnectionRecord[];
};
