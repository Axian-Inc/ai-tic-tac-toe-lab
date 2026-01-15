import { describe, expect, it } from 'vitest';

import { GameStateSchema, MoveResponseSchema, NewGameRequestSchema } from '../../shared';

const createState = () => ({
  board: Array.from({ length: 9 }, () => null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-123',
});

describe('web shared schemas', () => {
  it('validates new game requests with shared schema', () => {
    const parsed = NewGameRequestSchema.safeParse({
      startingPlayer: 'O',
      opponentId: 'defensive',
    });

    expect(parsed.success).toBe(true);
  });

  it('validates move responses with shared schema', () => {
    const state = GameStateSchema.parse(createState());
    const parsed = MoveResponseSchema.safeParse({ state, aiRationale: 'Test.' });

    expect(parsed.success).toBe(true);
  });
});
