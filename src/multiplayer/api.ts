import type {
  CreateGameResponse,
  ListGamesResponse,
  MultiplayerGameStatus,
} from "../shared/multiplayer";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_MULTIPLAYER_API_BASE_URL;

  if (typeof configuredBaseUrl === "string" && configuredBaseUrl.trim().length > 0) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return DEFAULT_API_BASE_URL;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (typeof errorBody.message === "string" && errorBody.message.length > 0) {
        message = errorBody.message;
      }
    } catch {
      // Ignore non-JSON error payloads and fall back to the HTTP status message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function createMultiplayerGame(): Promise<CreateGameResponse> {
  const response = await fetch(`${getApiBaseUrl()}/games`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
  });

  return readJsonResponse<CreateGameResponse>(response);
}

export async function listMultiplayerGames(
  status: MultiplayerGameStatus
): Promise<ListGamesResponse> {
  const query = new URLSearchParams({ status });
  const response = await fetch(`${getApiBaseUrl()}/games?${query.toString()}`);

  return readJsonResponse<ListGamesResponse>(response);
}
