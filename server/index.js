import http from 'http'
import { randomUUID } from 'crypto'
import { URL, fileURLToPath } from 'url'
import path from 'path'

const PORT = Number.parseInt(process.env.PORT || '5174', 10)
export const VALID_STATUSES = new Set(['waiting', 'active', 'over'])

export const createEmptyBoard = () => [
  [null, null, null],
  [null, null, null],
  [null, null, null],
]

export const createGameState = () => ({
  board: createEmptyBoard(),
  currentPlayer: 'X',
  winner: null,
  isDraw: false,
  moveHistory: [],
})

export const createGameRecord = ({ playerName, gameName, now, id }) => {
  const createdAt = now ?? new Date().toISOString()
  const gameId = id ?? randomUUID()
  const hostName = typeof playerName === 'string' ? playerName.trim() : null
  const name = typeof gameName === 'string' ? gameName.trim() : null

  return {
    id: gameId,
    status: 'waiting',
    name: name || null,
    createdAt,
    updatedAt: createdAt,
    players: {
      X: hostName || null,
      O: null,
    },
    state: createGameState(),
  }
}

export const toGameSummary = (game) => ({
  id: game.id,
  status: game.status,
  name: game.name,
  createdAt: game.createdAt,
  players: game.players,
})

export const isValidStatus = (status) =>
  typeof status === 'string' && VALID_STATUSES.has(status)

const getWinner = (board) => {
  const lines = [
    // Rows
    [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
    [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
    [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
    // Columns
    [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ],
    [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ],
    [
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ],
    // Diagonals
    [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ],
    [
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
    ],
  ]

  for (const line of lines) {
    const [a, b, c] = line
    const first = board[a.row][a.col]
    if (first && first === board[b.row][b.col] && first === board[c.row][c.col]) {
      return first
    }
  }

  return null
}

const isDraw = (board, winner) => {
  if (winner) return false
  return board.every((row) => row.every((cell) => cell !== null))
}

const isWithinBounds = (position) =>
  position.row >= 0 &&
  position.row < 3 &&
  position.col >= 0 &&
  position.col < 3

const isMoveValid = (game, move) => {
  if (!move || !isWithinBounds(move)) return false
  if (game.status !== 'active') return false
  if (game.state.winner || game.state.isDraw) return false
  if (move.player !== game.state.currentPlayer) return false
  return game.state.board[move.row][move.col] === null
}

const applyMove = (game, move) => {
  const nextBoard = game.state.board.map((row) => [...row])
  nextBoard[move.row][move.col] = move.player

  const winner = getWinner(nextBoard)
  const draw = isDraw(nextBoard, winner)
  const nextState = {
    board: nextBoard,
    currentPlayer: move.player === 'X' ? 'O' : 'X',
    winner,
    isDraw: draw,
    moveHistory: [...game.state.moveHistory, move],
  }

  return {
    ...game,
    status: winner || draw ? 'over' : game.status,
    updatedAt: new Date().toISOString(),
    state: nextState,
  }
}

const json = (res, statusCode, payload) => {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1000000) {
        reject(new Error('Payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(null)
        return
      }

      const raw = Buffer.concat(chunks).toString('utf-8')
      if (!raw) {
        resolve(null)
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })

// POST /games
// Creates a new multiplayer game in waiting state.
// Request body (JSON):
// - playerName: optional string for the host player (X). Trimmed; empty becomes null.
// - gameName: optional string for display. Trimmed; empty becomes null.
// Response:
// - 201 with { gameId, game } on success.
// - 400 if JSON payload is invalid.
// - 413 if payload exceeds 1 MB.
// - 500 for unexpected server errors.
const handleCreateGame = async (req, res, games) => {
  const body = await readJsonBody(req)
  const game = createGameRecord({
    playerName: body && body.playerName,
    gameName: body && body.gameName,
  })

  games.set(game.id, game)

  return json(res, 201, {
    gameId: game.id,
    game,
  })
}

// GET /games
// Lists games, optionally filtered by status.
// Query params:
// - status: optional; one of "waiting", "active", "over".
// Response:
// - 200 with { games: [summary] } where each summary includes id, status, name, createdAt, players.
// - 400 if the status filter is invalid.
const handleListGames = (req, res, url, games) => {
  const status = url.searchParams.get('status')
  if (status && !isValidStatus(status)) {
    return json(res, 400, { error: 'Invalid status filter.' })
  }

  const list = [...games.values()]
    .filter((game) => (status ? game.status === status : true))
    .map(toGameSummary)

  return json(res, 200, { games: list })
}

// POST /games/:id/join
// Joins a waiting game as player O.
// Request body (JSON):
// - playerName: optional string for the joiner. Trimmed; empty becomes null.
// Response:
// - 200 with { game } on success.
// - 404 if the game does not exist.
// - 409 if the game is not waiting or already full.
// - 400 if JSON payload is invalid.
// - 413 if payload exceeds 1 MB.
// - 500 for unexpected server errors.
const handleJoinGame = async (req, res, games, gameId) => {
  const game = games.get(gameId)
  if (!game) return json(res, 404, { error: 'Game not found.' })
  if (game.status !== 'waiting') {
    return json(res, 409, { error: 'Game is not available to join.' })
  }

  const body = await readJsonBody(req)
  const joinerName =
    body && typeof body.playerName === 'string' ? body.playerName.trim() : null

  if (game.players.O) {
    return json(res, 409, { error: 'Game is already full.' })
  }

  const updated = {
    ...game,
    status: 'active',
    updatedAt: new Date().toISOString(),
    players: {
      ...game.players,
      O: joinerName || null,
    },
  }

  games.set(gameId, updated)

  return json(res, 200, { game: updated })
}

// POST /games/:id/moves
// Applies a move to an active game.
// Request body (JSON):
// - move: { row, col, player } where row/col are 0-2 and player is "X" or "O".
// Response:
// - 200 with { game } containing the updated board, turn, and game status.
// - 400 if the move is invalid or JSON payload is invalid.
// - 404 if the game does not exist.
// - 413 if payload exceeds 1 MB.
// - 500 for unexpected server errors.
const handleMove = async (req, res, games, gameId) => {
  const game = games.get(gameId)
  if (!game) return json(res, 404, { error: 'Game not found.' })

  const body = await readJsonBody(req)
  const move = body ? body.move : null

  if (!isMoveValid(game, move)) {
    return json(res, 400, { error: 'Invalid move.' })
  }

  const updated = applyMove(game, move)
  games.set(gameId, updated)

  return json(res, 200, { game: updated })
}

// Creates an HTTP server that exposes the multiplayer game API.
// Routes:
// - POST /games
// - GET /games?status=waiting|active|over
// - POST /games/:id/join
// - POST /games/:id/moves
// Error handling:
// - Invalid JSON => 400
// - Payload too large (> 1 MB) => 413
// - Unknown routes => 404
// - Unhandled errors => 500
export const createServer = ({ games = new Map() } = {}) =>
  http.createServer(async (req, res) => {
    try {
      const url = new URL(
        req.url || '/',
        `http://${req.headers.host || 'localhost'}`,
      )
      if (req.method === 'POST' && url.pathname === '/games') {
        return await handleCreateGame(req, res, games)
      }

      if (req.method === 'GET' && url.pathname === '/games') {
        return handleListGames(req, res, url, games)
      }

      const joinMatch = url.pathname.match(/^\/games\/([^/]+)\/join$/)
      if (req.method === 'POST' && joinMatch) {
        return await handleJoinGame(req, res, games, joinMatch[1])
      }

      const moveMatch = url.pathname.match(/^\/games\/([^/]+)\/moves$/)
      if (req.method === 'POST' && moveMatch) {
        return await handleMove(req, res, games, moveMatch[1])
      }

      return json(res, 404, { error: 'Not found.' })
    } catch (error) {
      if (error instanceof SyntaxError) {
        return json(res, 400, { error: 'Invalid JSON payload.' })
      }

      if (error instanceof Error && error.message === 'Payload too large') {
        return json(res, 413, { error: 'Payload too large.' })
      }

      return json(res, 500, { error: 'Server error.' })
    }
  })

export const startServer = (port = PORT) =>
  new Promise((resolve) => {
    const server = createServer()
    server.listen(port, () => resolve(server))
  })

const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')

if (isMain) {
  startServer(PORT).then(() => {
    // eslint-disable-next-line no-console
    console.log(`Multiplayer server listening on http://localhost:${PORT}`)
  })
}
