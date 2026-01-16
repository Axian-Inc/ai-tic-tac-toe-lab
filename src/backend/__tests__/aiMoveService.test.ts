import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import type { FastifyBaseLogger } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import type { GameState } from '../../shared';
import { createAiMoveService, getMustDoMove, opponentProfiles } from '../services/aiMoveService';

const createState = (overrides: Partial<GameState>): GameState => ({
  board: Array(9).fill(null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-1',
  moveHistory: [],
  ...overrides,
});

const createLogger = () =>
  ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }) as unknown as FastifyBaseLogger;

const createBedrockClient = (responses: string[]) => {
  let callIndex = 0;

  return {
    send: vi.fn(async () => {
      const text = responses[Math.min(callIndex, responses.length - 1)];
      callIndex += 1;
      return {
        body: new TextEncoder().encode(
          JSON.stringify({
            content: [{ text }],
          }),
        ),
      };
    }),
  } as unknown as BedrockRuntimeClient;
};

describe('AI must-do scenarios', () => {
  const scenarios = [
    {
      name: 'takes winning move across top row',
      state: createState({
        board: ['X', 'X', null, 'O', 'O', null, null, null, null],
        nextPlayer: 'X',
      }),
      expected: 2,
    },
    {
      name: 'blocks opponent winning move',
      state: createState({
        board: ['O', 'O', null, 'X', null, null, null, 'X', null],
        nextPlayer: 'X',
      }),
      expected: 2,
    },
    {
      name: 'wins as O on middle row',
      state: createState({
        board: ['X', 'X', null, 'O', 'O', null, null, null, 'X'],
        nextPlayer: 'O',
      }),
      expected: 5,
    },
  ];

  for (const profile of opponentProfiles) {
    for (const scenario of scenarios) {
      it(`${profile.id} ${scenario.name}`, () => {
        expect(getMustDoMove(profile.id, scenario.state)).toBe(scenario.expected);
      });
    }
  }
});

describe('AI parsing validation', () => {
  it('accepts a valid move without rationale', async () => {
    const bedrockClient = createBedrockClient([JSON.stringify({ moveIndex: 4 })]);
    const service = createAiMoveService({ bedrockClient, modelId: 'test-model', timeoutMs: 5000 });
    const result = await service.getAiMove(createState({}), {
      logger: createLogger(),
      requestId: 'req-parse-1',
      sessionId: 'session-parse-1',
    });

    expect(result).toEqual({ moveIndex: 4, rationale: '' });
    expect(bedrockClient.send).toHaveBeenCalledTimes(1);
  });

  it('returns a must-do move without calling Bedrock', async () => {
    const bedrockClient = createBedrockClient(['{"moveIndex":4}']);
    const service = createAiMoveService({ bedrockClient, modelId: 'test-model', timeoutMs: 5000 });
    const result = await service.getAiMove(
      createState({
        board: ['X', 'X', null, null, 'O', null, 'O', null, null],
        nextPlayer: 'X',
      }),
      {
        logger: createLogger(),
        requestId: 'req-must-do-1',
        sessionId: 'session-must-do-1',
      },
    );

    expect(result).toEqual({
      moveIndex: 2,
      rationale: 'Forced move to take a win or block an immediate loss.',
    });
    expect(bedrockClient.send).toHaveBeenCalledTimes(0);
  });

  it('rejects invalid schema responses with extra keys', async () => {
    const bedrockClient = createBedrockClient([
      JSON.stringify({ moveIndex: 4, rationale: 'Extra', extra: 'nope' }),
    ]);
    const service = createAiMoveService({ bedrockClient, modelId: 'test-model', timeoutMs: 5000 });
    const result = await service.getAiMove(createState({}), {
      logger: createLogger(),
      requestId: 'req-parse-2',
      sessionId: 'session-parse-2',
    });

    expect(result).toEqual({
      errorCode: 'AI_INVALID_OUTPUT',
      message: 'AI returned invalid output',
    });
    expect(bedrockClient.send).toHaveBeenCalledTimes(3);
  });

  it('rejects illegal moves even with valid schema', async () => {
    const bedrockClient = createBedrockClient([
      JSON.stringify({ moveIndex: 0, rationale: 'Top left.' }),
    ]);
    const service = createAiMoveService({ bedrockClient, modelId: 'test-model', timeoutMs: 5000 });
    const result = await service.getAiMove(
      createState({
        board: ['X', null, null, null, null, null, null, null, null],
        nextPlayer: 'O',
      }),
      {
        logger: createLogger(),
        requestId: 'req-parse-3',
        sessionId: 'session-parse-3',
      },
    );

    expect(result).toEqual({
      errorCode: 'AI_INVALID_OUTPUT',
      message: 'AI returned invalid output',
    });
    expect(bedrockClient.send).toHaveBeenCalledTimes(3);
  });
});

describe('AI move service retries', () => {
  it('retries invalid output and succeeds on a later attempt', async () => {
    const bedrockClient = createBedrockClient([
      'not json',
      JSON.stringify({ moveIndex: 0, rationale: 'Opening move.' }),
    ]);
    const service = createAiMoveService({ bedrockClient, modelId: 'test-model', timeoutMs: 5000 });
    const result = await service.getAiMove(createState({}), {
      logger: createLogger(),
      requestId: 'req-1',
      sessionId: 'session-1',
    });

    expect('errorCode' in result).toBe(false);
    if ('moveIndex' in result) {
      expect(result.moveIndex).toBe(0);
    }
    expect(bedrockClient.send).toHaveBeenCalledTimes(2);
  });

  it('returns AI_INVALID_OUTPUT after exhausting retries', async () => {
    const bedrockClient = createBedrockClient(['not json', 'still bad', 'nope']);
    const service = createAiMoveService({ bedrockClient, modelId: 'test-model', timeoutMs: 5000 });
    const result = await service.getAiMove(createState({}), {
      logger: createLogger(),
      requestId: 'req-2',
      sessionId: 'session-2',
    });

    expect(result).toEqual({
      errorCode: 'AI_INVALID_OUTPUT',
      message: 'AI returned invalid output',
    });
    expect(bedrockClient.send).toHaveBeenCalledTimes(3);
  });
});
