import { describe, expect, it } from 'vitest';

import { ErrorResponseSchema, MoveRequestSchema, MoveResponseSchema } from '../moveSchemas';

const baseState = {
  board: Array(9).fill(null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-010',
};

describe('MoveRequestSchema', () => {
  it('accepts a valid move request', () => {
    const payload = {
      state: baseState,
      playerMoveIndex: 4,
    };

    expect(MoveRequestSchema.parse(payload)).toEqual(payload);
  });

  it('rejects missing state', () => {
    const payload = {
      playerMoveIndex: 2,
    };

    expect(() => MoveRequestSchema.parse(payload)).toThrow();
  });

  it('rejects non-numeric playerMoveIndex', () => {
    const payload = {
      state: baseState,
      playerMoveIndex: '4',
    };

    expect(() => MoveRequestSchema.parse(payload)).toThrow();
  });
});

describe('MoveResponseSchema', () => {
  it('accepts a valid move response with rationale', () => {
    const payload = {
      state: baseState,
      aiRationale: 'Taking the center keeps options open.',
    };

    expect(MoveResponseSchema.parse(payload)).toEqual(payload);
  });

  it('accepts a valid move response without rationale', () => {
    const payload = {
      state: baseState,
    };

    expect(MoveResponseSchema.parse(payload)).toEqual(payload);
  });

  it('rejects non-string rationale', () => {
    const payload = {
      state: baseState,
      aiRationale: 123,
    };

    expect(() => MoveResponseSchema.parse(payload)).toThrow();
  });
});

describe('ErrorResponseSchema', () => {
  it('accepts a valid error response', () => {
    const payload = {
      errorCode: 'INVALID_INPUT',
      message: 'Missing state.',
      details: { field: 'state' },
    };

    expect(ErrorResponseSchema.parse(payload)).toEqual(payload);
  });

  it('rejects missing errorCode', () => {
    const payload = {
      message: 'Missing error code.',
    };

    expect(() => ErrorResponseSchema.parse(payload)).toThrow();
  });

  it('rejects missing message', () => {
    const payload = {
      errorCode: 'INVALID_INPUT',
    };

    expect(() => ErrorResponseSchema.parse(payload)).toThrow();
  });
});
