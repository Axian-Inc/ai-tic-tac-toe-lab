import type { FastifyBaseLogger } from 'fastify';
import { describe, expect, it } from 'vitest';

import type { GameState } from '../../shared';
import { createAiMoveService, getMustDoMove, opponentProfiles } from '../services/aiMoveService';

const hasModelId = Boolean(process.env.BEDROCK_MODEL_ID);
const runIntegration = process.env.RUN_BEDROCK_INTEGRATION === '1' && hasModelId;

const createLogger = () =>
  ({
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
  }) as unknown as FastifyBaseLogger;

const createState = (overrides: Partial<GameState>): GameState => ({
  board: Array(9).fill(null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-integration',
  moveHistory: [],
  ...overrides,
});

const scenarios = [
  {
    name: 'empty board opening',
    state: createState({}),
  },
  {
    name: 'early mixed board (O to move)',
    state: createState({
      board: ['X', 'O', null, null, null, 'X', null, null, null],
      nextPlayer: 'O',
    }),
  },
  {
    name: 'mid board no immediate win (X to move)',
    state: createState({
      board: ['X', 'O', null, null, null, 'X', 'O', null, null],
      nextPlayer: 'X',
    }),
  },
  {
    name: 'mid board no immediate win (O to move)',
    state: createState({
      board: ['X', 'O', null, null, null, 'X', 'O', 'X', null],
      nextPlayer: 'O',
    }),
  },
];

if (!runIntegration) {
  describe.skip('Bedrock prompt integration', () => {
    it('skipped without RUN_BEDROCK_INTEGRATION=1 and BEDROCK_MODEL_ID', () => {});
  });
} else {
  describe('Bedrock prompt integration', () => {
    const aiMoveService = createAiMoveService();
    const logger = createLogger();

    for (const profile of opponentProfiles) {
      for (const [index, scenario] of scenarios.entries()) {
        it(
          `${profile.id} ${scenario.name}`,
          async () => {
            const state = { ...scenario.state, opponentId: profile.id };
            expect(getMustDoMove(profile.id, state)).toBeNull();

            const result = await aiMoveService.getAiMove(state, {
              logger,
              requestId: `integration-${profile.id}-${index}`,
              sessionId: state.sessionId,
            });

            if ('errorCode' in result) {
              throw new Error(`${result.errorCode}: ${result.message}`);
            }

            expect(Number.isInteger(result.moveIndex)).toBe(true);
            expect(result.moveIndex).toBeGreaterThanOrEqual(0);
            expect(result.moveIndex).toBeLessThanOrEqual(8);
            expect(state.board[result.moveIndex]).toBeNull();
            expect(typeof result.rationale).toBe('string');
          },
          30_000,
        );
      }
    }
  });
}
