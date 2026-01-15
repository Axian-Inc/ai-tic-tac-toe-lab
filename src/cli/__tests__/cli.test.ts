import { describe, expect, it, vi } from 'vitest';

import type { ApiClient, GameState } from '../../shared';
import { parseArgs, runPlay } from '../cli';

type TestIO = {
  prompt: (message: string) => Promise<string>;
  print: (message: string) => void;
};

const createTestIo = (inputs: string[]) => {
  const outputs: string[] = [];
  let cursor = 0;

  const io: TestIO = {
    prompt: async () => inputs[cursor++] ?? '',
    print: (message: string) => {
      outputs.push(message);
    },
  };

  return { io, outputs };
};

const createState = (overrides: Partial<GameState> = {}): GameState => ({
  board: Array.from({ length: 9 }, () => null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-123',
  ...overrides,
});

describe('parseArgs', () => {
  it('parses play arguments', () => {
    const result = parseArgs([
      'play',
      '--api-base-url',
      'http://localhost:3000',
      '--opponent',
      'balanced',
      '--starting-player',
      'X',
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.args).toEqual({
      command: 'play',
      apiBaseUrl: 'http://localhost:3000',
      opponentId: 'balanced',
      startingPlayer: 'X',
    });
  });

  it('fails when required arguments are missing', () => {
    const result = parseArgs(['play', '--api-base-url', 'http://localhost:3000']);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.errorCode).toBe('INVALID_INPUT');
  });
});

describe('runPlay', () => {
  it('runs a happy-path play loop', async () => {
    const initialState = createState();
    const finalState = createState({
      board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
      nextPlayer: 'O',
      gameStatus: 'win',
      winner: 'X',
    });
    const apiClient = {
      newGame: vi.fn(async () => ({ ok: true, data: initialState })),
      move: vi.fn(async () => ({
        ok: true,
        data: { state: finalState, aiRationale: 'Took the winning row.' },
      })),
    } satisfies ApiClient;
    const { io, outputs } = createTestIo(['0']);

    const exitCode = await runPlay({
      apiClient,
      io,
      startingPlayer: 'X',
      opponentId: 'balanced',
    });

    expect(exitCode).toBe(0);
    expect(outputs.join('\n')).toContain('Winner: X');
    expect(outputs.join('\n')).toContain('AI rationale: Took the winning row.');
    expect(apiClient.newGame).toHaveBeenCalledTimes(1);
    expect(apiClient.move).toHaveBeenCalledTimes(1);
  });

  it('prints API errors and exits', async () => {
    const initialState = createState();
    const apiClient = {
      newGame: vi.fn(async () => ({ ok: true, data: initialState })),
      move: vi.fn(async () => ({
        ok: false,
        error: { errorCode: 'INVALID_MOVE', message: 'Cell occupied.' },
      })),
    } satisfies ApiClient;
    const { io, outputs } = createTestIo(['0']);

    const exitCode = await runPlay({
      apiClient,
      io,
      startingPlayer: 'X',
      opponentId: 'balanced',
    });

    expect(exitCode).toBe(1);
    expect(outputs.join('\n')).toContain('ERROR INVALID_MOVE: Cell occupied.');
  });
});
