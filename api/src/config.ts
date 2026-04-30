export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const optionalEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value === undefined || value.length === 0 ? undefined : value;
};

export const config = {
  gamesTableName: () => requireEnv("GAMES_TABLE_NAME"),
  eventsTableName: () => requireEnv("EVENTS_TABLE_NAME"),
  connectionsTableName: () => requireEnv("CONNECTIONS_TABLE_NAME"),
  countersTableName: () => requireEnv("COUNTERS_TABLE_NAME"),
  gamesStateIndexName: () => optionalEnv("GAMES_STATE_INDEX_NAME") ?? "state-updatedAt-index",
  connectionsGameIndexName: () => optionalEnv("CONNECTIONS_GAME_INDEX_NAME") ?? "gameId-index",
  websocketCallbackEndpoint: () => optionalEnv("WEBSOCKET_CALLBACK_ENDPOINT"),
};
