export type Player = 'X' | 'O';
export type Cell = Player | null;

export type MultiplayerGame = {
  id: string;
  board: Cell[];
  nextTurn: Player;
  winner: Player | null;
  isDraw: boolean;
  status: 'waiting' | 'active' | 'over';
  completedReason: 'player_left' | null;
  players: {
    X: boolean;
    O: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type PlayerAssignment = {
  game: MultiplayerGame;
  assignedSymbol: Player;
  playerId: string;
};

export type GameEvent =
  | { type: 'subscription.confirmed'; gameId: string }
  | { type: 'game.joined'; game: MultiplayerGame }
  | { type: 'game.updated'; game: MultiplayerGame }
  | { type: string; game?: MultiplayerGame; gameId?: string };

const DEFAULT_BACKEND_BASE_URL = 'http://127.0.0.1:4000';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_BACKEND_BASE_URL).replace(/\/$/, '');
const WS_BASE_URL = (process.env.REACT_APP_WS_BASE_URL || DEFAULT_BACKEND_BASE_URL).replace(/\/$/, '');

async function parseJsonResponse(response: Response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorCode = typeof body.error === 'string' ? body.error : 'REQUEST_FAILED';
    throw new Error(errorCode);
  }

  return body;
}

export async function createGame(): Promise<PlayerAssignment> {
  const response = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
  });

  return parseJsonResponse(response);
}

export async function joinGame(gameId: string): Promise<PlayerAssignment> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/join`, {
    method: 'POST',
  });

  return parseJsonResponse(response);
}

export async function listActiveGames(): Promise<MultiplayerGame[]> {
  const response = await fetch(`${API_BASE_URL}/games`);
  const body = await parseJsonResponse(response);
  return Array.isArray(body.games) ? (body.games as MultiplayerGame[]) : [];
}

export async function getGame(gameId: string): Promise<MultiplayerGame> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
  const body = await parseJsonResponse(response);
  return body.game as MultiplayerGame;
}

export async function makeMove(gameId: string, playerId: string, position: number): Promise<MultiplayerGame> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/moves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      position,
    }),
  });

  const body = await parseJsonResponse(response);
  return body.game as MultiplayerGame;
}

export async function leaveGame(gameId: string, playerId: string): Promise<MultiplayerGame> {
  const response = await fetch(`${API_BASE_URL}/games/${gameId}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
    }),
  });

  const body = await parseJsonResponse(response);
  return body.game as MultiplayerGame;
}

export function getGameWebSocketUrl(gameId: string): string {
  const wsBaseUrl = new URL(WS_BASE_URL);
  const wsProtocol = wsBaseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${wsBaseUrl.host}/wstest?gameId=${encodeURIComponent(gameId)}`;
}
