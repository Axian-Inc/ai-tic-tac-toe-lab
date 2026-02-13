import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { GameRecord } from "./store.js";

export type GamePersistence = {
  save: (game: GameRecord) => Promise<void>;
  get: (id: string) => Promise<GameRecord | null>;
  listAll: () => Promise<GameRecord[]>;
};

export class InMemoryPersistence implements GamePersistence {
  private games = new Map<string, GameRecord>();

  async save(game: GameRecord): Promise<void> {
    this.games.set(game.id, game);
  }

  async get(id: string): Promise<GameRecord | null> {
    return this.games.get(id) ?? null;
  }

  async listAll(): Promise<GameRecord[]> {
    return Array.from(this.games.values());
  }
}

export class DynamoDbPersistence implements GamePersistence {
  private client: DynamoDBDocumentClient;

  constructor(private tableName: string, region: string) {
    const ddb = new DynamoDBClient({ region });
    this.client = DynamoDBDocumentClient.from(ddb, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async save(game: GameRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: game,
      })
    );
  }

  async get(id: string): Promise<GameRecord | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return (result.Item as GameRecord | undefined) ?? null;
  }

  async listAll(): Promise<GameRecord[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    return (result.Items as GameRecord[] | undefined) ?? [];
  }
}

export function createPersistenceFromEnv(): GamePersistence | null {
  const tableName = process.env.DDB_TABLE_NAME;
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!tableName || !region) {
    return null;
  }
  return new DynamoDbPersistence(tableName, region);
}
