import { describe, expect, it } from 'vitest'
import {
  createGameRecord,
  createGameState,
  isValidStatus,
  toGameSummary,
} from '../index.js'

describe('multiplayer server unit helpers', () => {
  it('creates an empty game state', () => {
    const state = createGameState()

    expect(state.currentPlayer).toBe('X')
    expect(state.winner).toBeNull()
    expect(state.isDraw).toBe(false)
    expect(state.moveHistory).toHaveLength(0)
    expect(state.board).toHaveLength(3)
    expect(state.board.every((row) => row.length === 3)).toBe(true)
    expect(state.board.flat().every((cell) => cell === null)).toBe(true)
  })

  it('creates a new game record with metadata', () => {
    const game = createGameRecord({
      id: 'game-123',
      now: '2026-03-20T23:00:00.000Z',
      playerName: 'Major Mischief',
      gameName: 'Battle of Wits',
    })

    expect(game.id).toBe('game-123')
    expect(game.status).toBe('waiting')
    expect(game.createdAt).toBe('2026-03-20T23:00:00.000Z')
    expect(game.players.X).toBe('Major Mischief')
    expect(game.players.O).toBeNull()
    expect(game.name).toBe('Battle of Wits')
  })

  it('summarizes a game record for list responses', () => {
    const game = createGameRecord({
      id: 'game-abc',
      now: '2026-03-20T23:10:00.000Z',
      playerName: 'Player 1',
      gameName: 'Arena',
    })
    const summary = toGameSummary(game)

    expect(summary).toEqual({
      id: 'game-abc',
      status: 'waiting',
      name: 'Arena',
      createdAt: '2026-03-20T23:10:00.000Z',
      players: {
        X: 'Player 1',
        O: null,
      },
    })
  })

  it('validates status filters', () => {
    expect(isValidStatus('waiting')).toBe(true)
    expect(isValidStatus('active')).toBe(true)
    expect(isValidStatus('over')).toBe(true)
    expect(isValidStatus('bogus')).toBe(false)
    expect(isValidStatus(null)).toBe(false)
  })
})
