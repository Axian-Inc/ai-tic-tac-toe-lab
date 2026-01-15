import { describe, expect, it } from 'vitest';

import { GameStateSchema, MoveRequestSchema, NewGameRequestSchema } from '../../shared';
import { buildMoveRequest, buildNewGameRequest } from '../client';

const createState = () => ({
  board: Array.from({ length: 9 }, () => null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-123',
});

describe('CLI shared schemas', () => {
  it('builds a valid new game request', () => {
    const request = buildNewGameRequest('X', 'balanced');
    const parsed = NewGameRequestSchema.safeParse(request);

    expect(parsed.success).toBe(true);
  });

  it('builds a valid move request', () => {
    const state = GameStateSchema.parse(createState());
    const request = buildMoveRequest(state, 0);
    const parsed = MoveRequestSchema.safeParse(request);

    expect(parsed.success).toBe(true);
  });
});
