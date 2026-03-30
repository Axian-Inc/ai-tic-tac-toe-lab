import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { createServer } from '../index.js'

const startTestServer = () =>
  new Promise((resolve) => {
    const server = createServer()
    server.listen(0, () => {
      const address = server.address()
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
        wsUrl: `ws://127.0.0.1:${address.port}`,
      })
    })
  })

const createClient = (url) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const messages = []

    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()))
    })

    ws.on('open', () => resolve({ ws, messages }))
    ws.on('error', reject)
  })

const waitForType = async (messages, type, timeoutMs = 1500) => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const index = messages.findIndex((message) => message.type === type)
    if (index !== -1) {
      return messages.splice(index, 1)[0]
    }
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error(`Did not receive expected message type: ${type}`)
}

const waitForUnexpectedResponse = (ws) =>
  new Promise((resolve) => {
    ws.on('unexpected-response', (request, response) => {
      request.destroy()
      resolve(response.statusCode)
    })
  })

describe('multiplayer WebSocket updates', () => {
  let baseUrl
  let wsUrl
  let server

  beforeAll(async () => {
    const started = await startTestServer()
    baseUrl = started.baseUrl
    wsUrl = started.wsUrl
    server = started.server
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  it('sends a snapshot on connect and broadcasts moves and game over', async () => {
    const createResponse = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Host' }),
    })
    const created = await createResponse.json()

    await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    const client = await createClient(`${wsUrl}/ws?gameId=${created.gameId}`)
    const snapshot = await waitForType(client.messages, 'game_state')

    expect(snapshot.game.id).toBe(created.gameId)
    expect(snapshot.game.state.board.flat().every((cell) => cell === null)).toBe(true)

    const moves = [
      { row: 0, col: 0, player: 'X' },
      { row: 1, col: 0, player: 'O' },
      { row: 0, col: 1, player: 'X' },
      { row: 1, col: 1, player: 'O' },
      { row: 0, col: 2, player: 'X' },
    ]

    for (const move of moves) {
      const response = await fetch(`${baseUrl}/games/${created.gameId}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move }),
      })
      expect(response.status).toBe(200)
      await waitForType(client.messages, 'game_update')
    }

    const gameOver = await waitForType(client.messages, 'game_over')
    expect(gameOver.game.state.winner).toBe('X')

    client.ws.close()
  })

  it('lets spectators subscribe without affecting player slots', async () => {
    const createResponse = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Host' }),
    })
    const created = await createResponse.json()

    const client = await createClient(`${wsUrl}/ws?gameId=${created.gameId}`)
    const snapshot = await waitForType(client.messages, 'game_state')
    expect(snapshot.game.status).toBe('waiting')

    const joinResponse = await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    expect(joinResponse.status).toBe(200)
    const joined = await joinResponse.json()
    expect(joined.game.players.O).toBe('Joiner')
    expect(joined.game.state.currentPlayer).toBe('X')

    client.ws.close()
  })

  it('sends the latest state to a spectator who joins mid-game', async () => {
    const createResponse = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Host' }),
    })
    const created = await createResponse.json()

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
      body: JSON.stringify({ move: { row: 1, col: 1, player: 'O' } }),
    })

    const spectator = await createClient(`${wsUrl}/ws?gameId=${created.gameId}`)
    const snapshot = await waitForType(spectator.messages, 'game_state')

    expect(snapshot.game.players).toEqual({ X: 'Host', O: 'Joiner' })
    expect(snapshot.game.state.board[0][0]).toBe('X')
    expect(snapshot.game.state.board[1][1]).toBe('O')
    expect(snapshot.game.state.moveHistory).toHaveLength(2)
    expect(snapshot.game.state.currentPlayer).toBe('X')

    spectator.ws.close()
  })

  it('keeps spectator subscriptions read-only even if a client sends messages', async () => {
    const createResponse = await fetch(`${baseUrl}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Host' }),
    })
    const created = await createResponse.json()

    await fetch(`${baseUrl}/games/${created.gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Joiner' }),
    })

    const spectator = await createClient(`${wsUrl}/ws?gameId=${created.gameId}`)
    await waitForType(spectator.messages, 'game_state')

    spectator.ws.send(
      JSON.stringify({
        type: 'move',
        move: { row: 0, col: 0, player: 'X' },
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 50))

    const response = await fetch(`${baseUrl}/games/${created.gameId}`)
    expect(response.status).toBe(200)
    const payload = await response.json()

    expect(payload.game.state.board.flat().every((cell) => cell === null)).toBe(true)
    expect(payload.game.state.moveHistory).toHaveLength(0)

    spectator.ws.close()
  })

  it('rejects spectator subscriptions for non-existent games', async () => {
    const ws = new WebSocket(`${wsUrl}/ws?gameId=missing-game`)
    const statusCode = await waitForUnexpectedResponse(ws)

    expect(statusCode).toBe(404)
  })
})
