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

    client.ws.close()
  })
})
