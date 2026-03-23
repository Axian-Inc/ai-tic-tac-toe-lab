import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer } from '../index.js'

const startTestServer = (options = {}) =>
  new Promise((resolve) => {
    const server = createServer(options)
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

  it('retrieves full game history for replay', async () => {
    const created = await createGame({ playerName: 'Host' })

    await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    await fetch(`${baseUrl}/games/${created.gameId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move: { row: 0, col: 0, player: 'X' } }),
    })

    await fetch(`${baseUrl}/games/${created.gameId}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move: { row: 1, col: 0, player: 'O' } }),
    })

    const response = await fetch(`${baseUrl}/games/${created.gameId}`)
    expect(response.status).toBe(200)
    const payload = await response.json()

    expect(payload.game.id).toBe(created.gameId)
    expect(payload.game.state.moveHistory).toHaveLength(2)
    expect(payload.game.state.moveHistory[0]).toEqual({
      row: 0,
      col: 0,
      player: 'X',
    })
    expect(payload.game.state.moveHistory[1]).toEqual({
      row: 1,
      col: 0,
      player: 'O',
    })
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

  it('resigns a game and declares the other player winner', async () => {
    const created = await createGame({ playerName: 'Host' })

    await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    const resignResponse = await fetch(
      `${baseUrl}/games/${created.gameId}/resign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: 'X' }),
      },
    )

    expect(resignResponse.status).toBe(200)
    const payload = await resignResponse.json()
    expect(payload.game.status).toBe('over')
    expect(payload.game.state.winner).toBe('O')
  })

  it('rejects game creation when capacity is reached', async () => {
    const creations = []
    for (let i = 0; i < 25; i += 1) {
      creations.push(createGame({ playerName: `Host ${i}` }))
    }
    await Promise.all(creations)

    const response = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Overflow' }),
    })

    expect(response.status).toBe(429)
    const payload = await response.json()
    expect(payload.error).toBe('Game capacity reached.')
  })

  it('marks a game as abandoned automatically after inactivity', async () => {
    const started = await startTestServer({ abandonmentTimeoutMs: 40 })
    const localBaseUrl = started.baseUrl
    const localServer = started.server

    const createResponse = await fetch(`${localBaseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Host' }),
    })
    const created = await createResponse.json()

    await fetch(`${localBaseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    await new Promise((resolve) => setTimeout(resolve, 80))

    const listResponse = await fetch(`${localBaseUrl}/games?status=over`)
    expect(listResponse.status).toBe(200)
    const payload = await listResponse.json()
    const ids = payload.games.map((game) => game.id)
    expect(ids).toContain(created.gameId)

    await new Promise((resolve) => localServer.close(resolve))
  })
})
