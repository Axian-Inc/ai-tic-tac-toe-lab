import http from 'http'
import { randomUUID } from 'crypto'
import { URL, fileURLToPath } from 'url'
import path from 'path'
import WebSocket, { WebSocketServer } from 'ws'

const PORT = Number.parseInt(process.env.PORT || '5174', 10)
const MAX_CONCURRENT_GAMES = 25

const logHandlerStart = (label, context = {}) => {
  // eslint-disable-next-line no-console
  console.log(`[server] start ${label}`, context)
}

const logHandlerEnd = (label) => {
  // eslint-disable-next-line no-console
  console.log(`[server] end ${label}`)
}
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

const isValidPlayer = (player) => player === 'X' || player === 'O'

const resolveResignation = (game, resigningPlayer) => ({
  ...game,
  status: 'over',
  updatedAt: new Date().toISOString(),
  state: {
    ...game.state,
    winner: resigningPlayer === 'X' ? 'O' : 'X',
    isDraw: false,
  },
})

const resolveAbandonment = (game) => ({
  ...game,
  status: 'over',
  updatedAt: new Date().toISOString(),
  state: {
    ...game.state,
    winner: game.state.currentPlayer === 'X' ? 'O' : 'X',
    isDraw: false,
  },
})

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

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const json = (res, statusCode, payload) => {
  const body = JSON.stringify(payload)
  setCorsHeaders(res)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const respondUpgradeError = (socket, statusCode, message) => {
  const body = JSON.stringify({ error: message })
  socket.write(
    `HTTP/1.1 ${statusCode} ${http.STATUS_CODES[statusCode]}\r\n` +
      'Content-Type: application/json; charset=utf-8\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      'Connection: close\r\n' +
      '\r\n' +
      body,
  )
  socket.destroy()
}

// WebSocket protocol for multiplayer updates.
// Endpoint: WS /ws?gameId=...
// On connect: sends { type: "game_state", game } to allow catch-up.
// On valid move: broadcasts { type: "game_update", move, game }.
// On game end: broadcasts { type: "game_over", game }.
// On invalid subscription: closes the connection with an error response.
const createRealtimeHub = ({ games }) => {
  const wss = new WebSocketServer({ noServer: true })
  const subscribers = new Map()

  const getSubscribers = (gameId) => {
    if (!subscribers.has(gameId)) {
      subscribers.set(gameId, new Set())
    }
    return subscribers.get(gameId)
  }

  const removeSubscriber = (gameId, ws) => {
    const set = subscribers.get(gameId)
    if (!set) return
    set.delete(ws)
    if (set.size === 0) {
      subscribers.delete(gameId)
    }
  }

  const send = (ws, payload) => {
    if (ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify(payload))
  }

  const broadcast = (gameId, payload) => {
    const set = subscribers.get(gameId)
    if (!set) return
    // eslint-disable-next-line no-console
    console.log('[server] ws broadcast', {
      gameId,
      type: payload?.type,
      recipients: set.size,
    })
    for (const ws of set) {
      send(ws, payload)
    }
  }

  const handleUpgrade = (req, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    if (url.pathname !== '/ws') {
      socket.destroy()
      return
    }

    const gameId = url.searchParams.get('gameId')
    if (!gameId) {
      respondUpgradeError(socket, 400, 'Missing gameId.')
      return
    }

    const game = games.get(gameId)
    if (!game) {
      respondUpgradeError(socket, 404, 'Game not found.')
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, { gameId })
    })
  }

  wss.on('connection', (ws, _req, client) => {
    const gameId = client ? client.gameId : null
    const game = gameId ? games.get(gameId) : null
    if (!gameId || !game) {
      send(ws, { type: 'error', error: 'Game not found.' })
      ws.close(1008, 'Game not found.')
      return
    }

    const set = getSubscribers(gameId)
    set.add(ws)
    send(ws, { type: 'game_state', game })

    ws.on('close', () => removeSubscriber(gameId, ws))
  })

  return {
    handleUpgrade,
    broadcastGameUpdate: (game, move) =>
      broadcast(game.id, { type: 'game_update', move: move ?? null, game }),
    broadcastGameOver: (game) => broadcast(game.id, { type: 'game_over', game }),
  }
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
  const label = 'POST /games'
  logHandlerStart(label)
  try {
    const activeCount = [...games.values()].filter(
      (game) => game.status !== 'over',
    ).length
    if (activeCount >= MAX_CONCURRENT_GAMES) {
      return json(res, 429, { error: 'Game capacity reached.' })
    }

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
  } finally {
    logHandlerEnd(label)
  }
}

// GET /games
// Lists games, optionally filtered by status.
// Query params:
// - status: optional; one of "waiting", "active", "over".
// Response:
// - 200 with { games: [summary] } where each summary includes id, status, name, createdAt, players.
// - 400 if the status filter is invalid.
const handleListGames = (req, res, url, games) => {
  const label = 'GET /games'
  logHandlerStart(label, { status: url.searchParams.get('status') })
  try {
    const status = url.searchParams.get('status')
    if (status && !isValidStatus(status)) {
      return json(res, 400, { error: 'Invalid status filter.' })
    }

    const list = [...games.values()]
      .filter((game) => (status ? game.status === status : true))
      .map(toGameSummary)

    return json(res, 200, { games: list })
  } finally {
    logHandlerEnd(label)
  }
}

// GET /games/:id
// Retrieves the full game record, including move history, for replay or inspection.
// Response:
// - 200 with { game } on success.
// - 404 if the game does not exist.
const handleGetGame = (req, res, games, gameId) => {
  const label = 'GET /games/:id'
  logHandlerStart(label, { gameId })
  try {
    const game = games.get(gameId)
    if (!game) return json(res, 404, { error: 'Game not found.' })
    return json(res, 200, { game })
  } finally {
    logHandlerEnd(label)
  }
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
const handleJoinGame = async (
  req,
  res,
  games,
  gameId,
  scheduler,
  realtimeHub,
) => {
  const label = 'POST /games/:id/join'
  logHandlerStart(label, { gameId })
  try {
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
    scheduler.schedule(updated)
    realtimeHub.broadcastGameUpdate(updated, null)

    return json(res, 200, { game: updated })
  } finally {
    logHandlerEnd(label)
  }
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
const handleMove = async (req, res, games, gameId, realtimeHub, scheduler) => {
  const label = 'POST /games/:id/moves'
  logHandlerStart(label, { gameId })
  try {
    const game = games.get(gameId)
    if (!game) return json(res, 404, { error: 'Game not found.' })

    const body = await readJsonBody(req)
    const move = body ? body.move : null

    if (!isMoveValid(game, move)) {
      return json(res, 400, { error: 'Invalid move.' })
    }

    const updated = applyMove(game, move)
    games.set(gameId, updated)

    realtimeHub.broadcastGameUpdate(updated, move)
    if (updated.status === 'over') {
      realtimeHub.broadcastGameOver(updated)
      scheduler.clear(gameId)
    } else {
      scheduler.schedule(updated)
    }

    return json(res, 200, { game: updated })
  } finally {
    logHandlerEnd(label)
  }
}

const createAbandonmentScheduler = ({ games, timeoutMs, realtimeHub }) => {
  const timers = new Map()

  const clear = (gameId) => {
    const existing = timers.get(gameId)
    if (existing) {
      clearTimeout(existing)
      timers.delete(gameId)
    }
  }

  const clearAll = () => {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }
    timers.clear()
  }

  const schedule = (game) => {
    if (!game || game.status !== 'active') return

    clear(game.id)

    const lastActivity = Date.parse(game.updatedAt)
    const delay = Number.isNaN(lastActivity)
      ? timeoutMs
      : Math.max(lastActivity + timeoutMs - Date.now(), 0)

    const timer = setTimeout(() => {
      const latest = games.get(game.id)
      if (!latest || latest.status !== 'active') {
        clear(game.id)
        return
      }

      const latestActivity = Date.parse(latest.updatedAt)
      if (Number.isNaN(latestActivity)) {
        clear(game.id)
        return
      }

      if (Date.now() - latestActivity < timeoutMs) {
        schedule(latest)
        return
      }

      const updated = resolveAbandonment(latest)
      games.set(latest.id, updated)
      realtimeHub.broadcastGameOver(updated)
      clear(latest.id)
    }, delay)

    timers.set(game.id, timer)
  }

  return { schedule, clear, clearAll }
}

// POST /games/:id/resign
// Resigns an active game on behalf of a player.
// Request body (JSON):
// - player: "X" or "O" indicating the resigning player.
// Response:
// - 200 with { game } containing the winner and final status.
// - 400 if the player is missing/invalid or JSON payload is invalid.
// - 404 if the game does not exist.
// - 409 if the game is not active.
// - 413 if payload exceeds 1 MB.
// - 500 for unexpected server errors.
const handleResign = async (req, res, games, gameId, realtimeHub, scheduler) => {
  const label = 'POST /games/:id/resign'
  logHandlerStart(label, { gameId })
  try {
    const game = games.get(gameId)
    if (!game) return json(res, 404, { error: 'Game not found.' })
    if (game.status !== 'active') {
      return json(res, 409, { error: 'Game is not active.' })
    }

    const body = await readJsonBody(req)
    const resigningPlayer = body ? body.player : null
    if (!isValidPlayer(resigningPlayer)) {
      return json(res, 400, { error: 'Invalid resigning player.' })
    }

    const updated = resolveResignation(game, resigningPlayer)
    games.set(gameId, updated)
    realtimeHub.broadcastGameOver(updated)
    scheduler.clear(gameId)

    return json(res, 200, { game: updated })
  } finally {
    logHandlerEnd(label)
  }
}

// Creates an HTTP server that exposes the multiplayer game API.
// Routes:
// - POST /games
// - GET /games?status=waiting|active|over
// - GET /games/:id
// - POST /games/:id/join
// - POST /games/:id/moves
// - POST /games/:id/resign
// Error handling:
// - Invalid JSON => 400
// - Payload too large (> 1 MB) => 413
// - Unknown routes => 404
// - Unhandled errors => 500
// Options:
// - games: Map storage for game records.
// - abandonmentTimeoutMs: milliseconds of inactivity before auto-abandonment.
export const createServer = ({
  games = new Map(),
  abandonmentTimeoutMs = 3 * 60 * 1000,
} = {}) => {
  const realtimeHub = createRealtimeHub({ games })
  const scheduler = createAbandonmentScheduler({
    games,
    timeoutMs: abandonmentTimeoutMs,
    realtimeHub,
  })
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        setCorsHeaders(res)
        res.writeHead(204)
        res.end()
        return
      }

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

      const gameMatch = url.pathname.match(/^\/games\/([^/]+)$/)
      if (req.method === 'GET' && gameMatch) {
        return handleGetGame(req, res, games, gameMatch[1])
      }

      const joinMatch = url.pathname.match(/^\/games\/([^/]+)\/join$/)
      if (req.method === 'POST' && joinMatch) {
        return await handleJoinGame(
          req,
          res,
          games,
          joinMatch[1],
          scheduler,
          realtimeHub,
        )
      }

      const moveMatch = url.pathname.match(/^\/games\/([^/]+)\/moves$/)
      if (req.method === 'POST' && moveMatch) {
        return await handleMove(
          req,
          res,
          games,
          moveMatch[1],
          realtimeHub,
          scheduler,
        )
      }

      const resignMatch = url.pathname.match(/^\/games\/([^/]+)\/resign$/)
      if (req.method === 'POST' && resignMatch) {
        return await handleResign(
          req,
          res,
          games,
          resignMatch[1],
          realtimeHub,
          scheduler,
        )
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

  server.on('upgrade', realtimeHub.handleUpgrade)
  server.on('close', scheduler.clearAll)

  return server
}

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
