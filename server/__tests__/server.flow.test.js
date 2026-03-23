import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer } from '../index.js'

const startTestServer = () =>
  new Promise((resolve) => {
    const server = createServer()
    server.listen(0, () => {
      const address = server.address()
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      })
    })
  })

describe('multiplayer server flow', () => {
  let baseUrl
  let server
  const createGame = async (payload = {}) => {
    const response = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return response.json()
  }

  beforeAll(async () => {
    const started = await startTestServer()
    baseUrl = started.baseUrl
    server = started.server
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  it('creates a game and returns it in waiting list', async () => {
    const createResponse = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Major Mischief', gameName: 'Battle' }),
    })

    expect(createResponse.status).toBe(201)
    const created = await createResponse.json()

    expect(created.gameId).toBeTypeOf('string')
    expect(created.game.status).toBe('waiting')
    expect(created.game.players.X).toBe('Major Mischief')

    const listResponse = await fetch(`${baseUrl}/games?status=waiting`)
    expect(listResponse.status).toBe(200)

    const listPayload = await listResponse.json()
    const ids = listPayload.games.map((game) => game.id)
    expect(ids).toContain(created.gameId)
  })

  it('rejects invalid status filters', async () => {
    const response = await fetch(`${baseUrl}/games?status=invalid`)
    expect(response.status).toBe(400)

    const payload = await response.json()
    expect(payload.error).toBe('Invalid status filter.')
  })

  it('joins a waiting game and activates it', async () => {
    const created = await createGame({ playerName: 'Host' })

    const joinResponse = await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    expect(joinResponse.status).toBe(200)
    const joined = await joinResponse.json()

    expect(joined.game.status).toBe('active')
    expect(joined.game.players.O).toBe('Joiner')
  })

  it('rejects joining a non-waiting game', async () => {
    const created = await createGame({ playerName: 'Host' })

    await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    const secondJoin = await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Other' }),
    })

    expect(secondJoin.status).toBe(409)
    const payload = await secondJoin.json()
    expect(payload.error).toBe('Game is not available to join.')
  })

  it('accepts a valid move after joining and rejects invalid moves', async () => {
    const created = await createGame({ playerName: 'Host' })

    await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    const invalidMove = await fetch(`${baseUrl}/games/${created.gameId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move: { row: 0, col: 0, player: 'O' } }),
    })

    expect(invalidMove.status).toBe(400)

    const validMove = await fetch(`${baseUrl}/games/${created.gameId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move: { row: 0, col: 0, player: 'X' } }),
    })

    expect(validMove.status).toBe(200)
    const payload = await validMove.json()
    expect(payload.game.state.board[0][0]).toBe('X')
    expect(payload.game.state.currentPlayer).toBe('O')
  })
})
