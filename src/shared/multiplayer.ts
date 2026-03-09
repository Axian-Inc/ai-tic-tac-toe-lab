export type MultiplayerGameStatus = "waiting" | "active" | "over";

export interface MultiplayerGameSummary {
  id: string;
  status: MultiplayerGameStatus;
  createdAt: string;
  updatedAt: string;
  openSeatCount: number;
}

export interface CreateGameResponse {
  game: MultiplayerGameSummary;
  joinCode: string;
}

export interface ListGamesResponse {
  games: MultiplayerGameSummary[];
}
