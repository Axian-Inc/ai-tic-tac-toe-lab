import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { URL, fileURLToPath } from 'node:url'
import path from 'node:path'

const PORT = Number.parseInt(process.env.PORT ?? '5174', 10)
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

const json = (res, statusCode, payload) => {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const readJsonBody = async (req) => {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    size += chunk.length
    if (size > 1_000_000) {
      throw new Error('Payload too large')
    }
    chunks.push(chunk)
  }

  if (chunks.length === 0) return null

  const raw = Buffer.concat(chunks).toString('utf-8')
  if (!raw) return null

  return JSON.parse(raw)
}

const handleCreateGame = async (req, res, games) => {
  const body = await readJsonBody(req)
  const game = createGameRecord({
    playerName: body?.playerName,
    gameName: body?.gameName,
  })

  games.set(game.id, game)

  return json(res, 201, {
    gameId: game.id,
    game,
  })
}

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

export const createServer = ({ games = new Map() } = {}) =>
  http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
      if (req.method === 'POST' && url.pathname === '/games') {
        return await handleCreateGame(req, res, games)
      }

      if (req.method === 'GET' && url.pathname === '/games') {
        return handleListGames(req, res, url, games)
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

const isMain = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')

if (isMain) {
  startServer(PORT).then(() => {
    // eslint-disable-next-line no-console
    console.log(`Multiplayer server listening on http://localhost:${PORT}`)
  })
}
