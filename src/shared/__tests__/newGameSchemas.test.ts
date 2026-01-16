import { describe, expect, it } from 'vitest';

import { NewGameRequestSchema } from '../newGameSchemas';

describe('NewGameRequestSchema', () => {
  it('accepts a valid new game request', () => {
    const payload = {
      startingPlayer: 'X',
      opponentId: 'balanced',
    };

    expect(NewGameRequestSchema.parse(payload)).toEqual(payload);
  });

  it('rejects missing startingPlayer', () => {
    const payload = {
      opponentId: 'balanced',
    };

    expect(() => NewGameRequestSchema.parse(payload)).toThrow();
  });

  it('rejects invalid startingPlayer', () => {
    const payload = {
      startingPlayer: 'Z',
      opponentId: 'balanced',
    };

    expect(() => NewGameRequestSchema.parse(payload)).toThrow();
  });

  it('rejects empty opponentId', () => {
    const payload = {
      startingPlayer: 'O',
      opponentId: '',
    };

    expect(() => NewGameRequestSchema.parse(payload)).toThrow();
  });
});
