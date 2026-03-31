export type PlayerSymbol = 'X' | 'O'
export type GameStatus = 'waiting' | 'active' | 'over'

export type MultiplayerMove = {
  row: number
  col: number
  player: PlayerSymbol
}

export type MultiplayerGameState = {
  board: Array<Array<PlayerSymbol | null>>
  currentPlayer: PlayerSymbol
  winner: PlayerSymbol | null
  isDraw: boolean
  endReason: 'win' | 'draw' | 'resign' | 'abandonment' | null
  moveHistory: MultiplayerMove[]
}

export type MultiplayerGame = {
  id: string
  status: GameStatus
  name: string | null
  createdAt: string
  updatedAt: string
  players: {
    X: string | null
    O: string | null
  }
  state: MultiplayerGameState
}

export type GameSummary = {
  id: string
  status: GameStatus
  name: string | null
  createdAt: string
  updatedAt: string
  currentPlayer: PlayerSymbol
  players: {
    X: string | null
    O: string | null
  }
}

const DEFAULT_HTTP_URL = 'http://127.0.0.1:5174'
const DEFAULT_WS_URL = 'ws://127.0.0.1:5174'

const API_BASE_URL = import.meta.env.VITE_MULTIPLAYER_URL || DEFAULT_HTTP_URL
const WS_BASE_URL = import.meta.env.VITE_MULTIPLAYER_WS_URL || DEFAULT_WS_URL

const fetchJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : 'Request failed.'
    throw new Error(message)
  }

  return payload as T
}

// Creates a multiplayer game as player X.
// Returns { gameId, game } on success.
export const createMultiplayerGame = async (payload: {
  playerName: string
  gameName: string
}) =>
  fetchJson<{ gameId: string; game: MultiplayerGame }>(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

// Lists waiting games for the join flow.
export const listWaitingGames = async () => {
  const response = await fetchJson<{ games: GameSummary[] }>(
    `${API_BASE_URL}/games?status=waiting`,
  )
  return response.games
}

// Lists active games for the spectate flow.
export const listActiveGames = async () => {
  const response = await fetchJson<{ games: GameSummary[] }>(
    `${API_BASE_URL}/games?status=active`,
  )
  return response.games
}

// Joins a game as player O.
// Returns { game } on success.
export const joinMultiplayerGame = async (payload: {
  gameId: string
  playerName: string
}) =>
  fetchJson<{ game: MultiplayerGame }>(
    `${API_BASE_URL}/games/${payload.gameId}/join`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: payload.playerName }),
    },
  )

// Fetches the full game record for replay or recovery.
export const getMultiplayerGame = async (gameId: string) =>
  fetchJson<{ game: MultiplayerGame }>(`${API_BASE_URL}/games/${gameId}`)

// Submits a move to the server.
// Returns { game } on success.
export const postMultiplayerMove = async (payload: {
  gameId: string
  move: MultiplayerMove
}) =>
  fetchJson<{ game: MultiplayerGame }>(
    `${API_BASE_URL}/games/${payload.gameId}/moves`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move: payload.move }),
    },
  )

// Resigns an active game on behalf of the current player.
// Returns { game } on success.
export const resignMultiplayerGame = async (payload: {
  gameId: string
  player: PlayerSymbol
}) =>
  fetchJson<{ game: MultiplayerGame }>(
    `${API_BASE_URL}/games/${payload.gameId}/resign`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: payload.player }),
    },
  )

export type MultiplayerMessage =
  | { type: 'game_state'; game: MultiplayerGame }
  | { type: 'game_update'; move: MultiplayerMove | null; game: MultiplayerGame }
  | { type: 'game_over'; game: MultiplayerGame }
  | { type: 'error'; error: string }

// Subscribes to WebSocket game updates and returns a cleanup function.
export const subscribeToGame = (
  gameId: string,
  onMessage: (message: MultiplayerMessage) => void,
) => {
  const socket = new WebSocket(`${WS_BASE_URL}/ws?gameId=${gameId}`)

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data) as MultiplayerMessage
      onMessage(message)
    } catch {
      // Ignore invalid payloads.
    }
  })

  socket.addEventListener('error', () => {
    // Suppress transient connection errors in development strict mode.
  })

  return () => {
    if (socket.readyState === WebSocket.CONNECTING) {
      socket.addEventListener('open', () => socket.close(), { once: true })
    } else {
      socket.close()
    }
  }
}
