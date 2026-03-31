import { describe, expect, it } from 'vitest';
import {
  ABANDONMENT_TIMEOUT_MS,
  BOARD_CELL_COUNT,
  MAX_CONCURRENT_MULTIPLAYER_GAMES,
  MULTIPLAYER_API_PATHS,
  MULTIPLAYER_EVENT_TYPES,
  type CreateGameResponse,
  type MultiplayerServerEvent,
} from '../../shared/contracts';

describe('multiplayer contract baseline', () => {
  it('locks the phase capacity and abandonment constraints', () => {
    expect(MAX_CONCURRENT_MULTIPLAYER_GAMES).toBe(25);
    expect(ABANDONMENT_TIMEOUT_MS).toBe(180_000);
    expect(BOARD_CELL_COUNT).toBe(9);
  });

  it('keeps the candidate api paths stable', () => {
    expect(MULTIPLAYER_API_PATHS).toEqual({
      createGame: '/games',
      listGames: '/games',
      joinGame: '/games/:gameId/join',
      submitMove: '/games/:gameId/moves',
      resignGame: '/games/:gameId/resign',
      abandonmentCheck: '/games/:gameId/abandonment-check',
      websocket: '/ws?gameId=:gameId',
    });
  });

  it('defines a unique event type for each websocket message family', () => {
    expect(new Set(MULTIPLAYER_EVENT_TYPES).size).toBe(MULTIPLAYER_EVENT_TYPES.length);
  });

  it('supports a full snapshot payload for create responses and websocket events', () => {
    const response = {
      game: {
        id: 'game_123',
        status: 'waiting',
        board: Array.from({ length: 9 }).fill(null),
        currentPlayer: null,
        winner: null,
        winningLine: null,
        endReason: null,
        createdAt: '2026-03-31T14:10:00.000Z',
        updatedAt: '2026-03-31T14:10:00.000Z',
        startedAt: null,
        endedAt: null,
        lastMoveAt: null,
        abandonmentDeadlineAt: null,
        replayCursor: 0,
        players: {
          host: {
            role: 'host',
            player: 'X',
            sessionId: 'session_host_123',
            joinedAt: '2026-03-31T14:10:00.000Z',
          },
          guest: null,
        },
        moves: [],
      },
      participant: {
        role: 'host',
        player: 'X',
        sessionId: 'session_host_123',
        joinedAt: '2026-03-31T14:10:00.000Z',
      },
      event: {
        eventId: 'event_1',
        gameId: 'game_123',
        sequence: 1,
        occurredAt: '2026-03-31T14:10:00.000Z',
        type: 'game.snapshot',
        reason: 'initial',
        game: {
          id: 'game_123',
          status: 'waiting',
          board: Array.from({ length: 9 }).fill(null),
          currentPlayer: null,
          winner: null,
          winningLine: null,
          endReason: null,
          createdAt: '2026-03-31T14:10:00.000Z',
          updatedAt: '2026-03-31T14:10:00.000Z',
          startedAt: null,
          endedAt: null,
          lastMoveAt: null,
          abandonmentDeadlineAt: null,
          replayCursor: 0,
          players: {
            host: {
              role: 'host',
              player: 'X',
              sessionId: 'session_host_123',
              joinedAt: '2026-03-31T14:10:00.000Z',
            },
            guest: null,
          },
          moves: [],
        },
      },
    } satisfies CreateGameResponse;

    const event = {
      eventId: 'event_2',
      gameId: response.game.id,
      sequence: 2,
      occurredAt: '2026-03-31T14:10:00.000Z',
      type: 'game.snapshot',
      reason: 'initial',
      game: response.game,
    } satisfies MultiplayerServerEvent;

    expect(response.game.status).toBe('waiting');
    expect(response.participant.player).toBe('X');
    expect(response.event.type).toBe('game.snapshot');
    expect(event.type).toBe('game.snapshot');
    expect(event.game.players.guest).toBeNull();
  });
});
