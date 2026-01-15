import { describe, expect, it } from 'vitest';

import { GameStateSchema, MoveRequestSchema, NewGameRequestSchema } from '../../shared';

const createState = () => ({
  board: Array.from({ length: 9 }, () => null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-123',
});

describe('backend shared schemas', () => {
  it('accepts new game payloads via shared schema', () => {
    const parsed = NewGameRequestSchema.safeParse({
      startingPlayer: 'X',
      opponentId: 'balanced',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts move payloads via shared schema', () => {
    const state = GameStateSchema.parse(createState());
    const parsed = MoveRequestSchema.safeParse({
      state,
      playerMoveIndex: 0,
    });

    expect(parsed.success).toBe(true);
  });
});
