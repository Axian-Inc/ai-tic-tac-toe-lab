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
})
