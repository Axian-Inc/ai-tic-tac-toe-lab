import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ErrorResponseSchema, GameStateSchema, MoveResponseSchema } from '../../shared';
import type { AiMoveService } from '../services/aiMoveService';
import { buildApp } from '../app';

const createWinningState = () => ({
  board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
  nextPlayer: 'O',
  gameStatus: 'win',
  winner: 'X',
  opponentId: 'balanced',
  sessionId: 'session-123',
});

describe('API', () => {
  let app: ReturnType<typeof buildApp>;
  let aiMoveService: AiMoveService;

  beforeEach(async () => {
    aiMoveService = {
      getAiMove: async (state) => {
        const moveIndex = state.board.findIndex((cell) => cell === null);
        if (moveIndex === -1) {
          return { errorCode: 'AI_INVALID_OUTPUT', message: 'no moves available' };
        }
        return { moveIndex, rationale: 'stubbed AI move' };
      },
    };
    app = buildApp({ aiMoveService });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns a new game state', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/new-game',
      payload: { startingPlayer: 'X', opponentId: 'balanced' },
    });

    expect(response.statusCode).toBe(200);
    const body = GameStateSchema.parse(response.json());
    expect(body.board).toEqual(Array(9).fill(null));
    expect(body.nextPlayer).toBe('X');
    expect(body.gameStatus).toBe('in_progress');
    expect(body.winner).toBeNull();
    expect(body.opponentId).toBe('balanced');
    expect(body.sessionId).toMatch(/\S+/);
    expect(body.moveHistory).toBeUndefined();
  });

  it('applies a player move and AI move', async () => {
    const newGame = await app.inject({
      method: 'POST',
      url: '/v1/new-game',
      payload: { startingPlayer: 'X', opponentId: 'balanced' },
    });

    const state = GameStateSchema.parse(newGame.json());
    const response = await app.inject({
      method: 'POST',
      url: '/v1/move',
      payload: { state, playerMoveIndex: 0 },
    });

    expect(response.statusCode).toBe(200);
    const body = MoveResponseSchema.parse(response.json());
    const filledCells = body.state.board.filter((cell) => cell !== null);
    expect(filledCells).toHaveLength(2);
    expect(body.state.nextPlayer).toBe('X');
    expect(body.state.moveHistory).toHaveLength(2);
  });

  it('rejects invalid moves', async () => {
    const newGame = await app.inject({
      method: 'POST',
      url: '/v1/new-game',
      payload: { startingPlayer: 'X', opponentId: 'balanced' },
    });

    const state = GameStateSchema.parse(newGame.json());
    const firstMove = await app.inject({
      method: 'POST',
      url: '/v1/move',
      payload: { state, playerMoveIndex: 0 },
    });

    const nextState = MoveResponseSchema.parse(firstMove.json()).state;
    const response = await app.inject({
      method: 'POST',
      url: '/v1/move',
      payload: { state: nextState, playerMoveIndex: 0 },
    });

    expect(response.statusCode).toBe(400);
    const body = ErrorResponseSchema.parse(response.json());
    expect(body.errorCode).toBe('INVALID_MOVE');
  });

  it('rejects missing fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/move',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    const body = ErrorResponseSchema.parse(response.json());
    expect(body.errorCode).toBe('INVALID_INPUT');
  });

  it('returns 409 on terminal state moves', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/move',
      payload: { state: createWinningState(), playerMoveIndex: 6 },
    });

    expect(response.statusCode).toBe(409);
    const body = ErrorResponseSchema.parse(response.json());
    expect(body.errorCode).toBe('TERMINAL_STATE');
  });
});
