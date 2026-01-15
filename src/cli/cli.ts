import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import type { ApiClient, ApiError, GameState, MoveResponse } from '../shared';

import { createCliClient } from './client';

type PlayerSymbol = 'X' | 'O';

type PlayArgs = {
  command: 'play';
  apiBaseUrl: string;
  opponentId: string;
  startingPlayer: PlayerSymbol;
};

type ParseSuccess = { ok: true; args: PlayArgs };

type ParseFailure = {
  ok: false;
  error: ApiError;
  usage: string;
};

export type CliIO = {
  prompt: (message: string) => Promise<string>;
  print: (message: string) => void;
  close?: () => void;
};

const usage = 'Usage: ttt play --api-base-url <url> --opponent <id> --starting-player X|O';

const parsePlayer = (value?: string): PlayerSymbol | null => {
  if (value === 'X' || value === 'O') {
    return value;
  }
  return null;
};

const buildParseError = (message: string): ParseFailure => ({
  ok: false,
  error: {
    errorCode: 'INVALID_INPUT',
    message,
  },
  usage,
});

export const parseArgs = (argv: string[]): ParseSuccess | ParseFailure => {
  const [command, ...rest] = argv;
  if (!command || command !== 'play') {
    return buildParseError('Missing or unsupported command.');
  }

  const options: Partial<Omit<PlayArgs, 'command'>> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    if (flag === '--api-base-url') {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) {
        return buildParseError('Missing value for --api-base-url.');
      }
      options.apiBaseUrl = value;
      index += 1;
      continue;
    }

    if (flag === '--opponent') {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) {
        return buildParseError('Missing value for --opponent.');
      }
      options.opponentId = value;
      index += 1;
      continue;
    }

    if (flag === '--starting-player') {
      const value = rest[index + 1];
      if (!value || value.startsWith('--')) {
        return buildParseError('Missing value for --starting-player.');
      }
      const parsed = parsePlayer(value);
      if (!parsed) {
        return buildParseError('Starting player must be X or O.');
      }
      options.startingPlayer = parsed;
      index += 1;
      continue;
    }

    if (flag === '--help' || flag === '-h') {
      return buildParseError('Help requested.');
    }

    return buildParseError(`Unknown option: ${flag ?? ''}`.trim());
  }

  if (!options.apiBaseUrl) {
    return buildParseError('Missing required --api-base-url.');
  }

  if (!options.opponentId) {
    return buildParseError('Missing required --opponent.');
  }

  if (!options.startingPlayer) {
    return buildParseError('Missing required --starting-player.');
  }

  return {
    ok: true,
    args: {
      command: 'play',
      apiBaseUrl: options.apiBaseUrl,
      opponentId: options.opponentId,
      startingPlayer: options.startingPlayer,
    },
  };
};

export const createConsoleIO = (): CliIO => {
  const rl = createInterface({ input: stdin, output: stdout });

  return {
    prompt: (message) => rl.question(message),
    print: (message) => {
      stdout.write(`${message}\n`);
    },
    close: () => {
      rl.close();
    },
  };
};

const formatError = (error: ApiError): string => `ERROR ${error.errorCode}: ${error.message}`;

const formatBoardCell = (cell: GameState['board'][number], index: number) =>
  cell ?? String(index);

export const formatBoard = (board: GameState['board']): string => {
  const rows = [0, 3, 6].map((start) =>
    [0, 1, 2]
      .map((offset) => formatBoardCell(board[start + offset], start + offset))
      .join(' | '),
  );

  return `${rows[0]}\n---+---+---\n${rows[1]}\n---+---+---\n${rows[2]}`;
};

const formatStatus = (state: GameState): string => {
  if (state.gameStatus === 'win') {
    return `Winner: ${state.winner ?? 'Unknown'}`;
  }

  if (state.gameStatus === 'draw') {
    return 'Draw game.';
  }

  return `Next player: ${state.nextPlayer}`;
};

const promptForMove = async (io: CliIO, state: GameState): Promise<number> => {
  while (true) {
    const raw = await io.prompt('Choose your move (0-8): ');
    const parsed = Number.parseInt(raw.trim(), 10);

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 8) {
      io.print(formatError({
        errorCode: 'INVALID_INPUT',
        message: 'Move must be an integer between 0 and 8.',
      }));
      continue;
    }

    if (state.board[parsed] !== null) {
      io.print(formatError({
        errorCode: 'INVALID_MOVE',
        message: 'Cell is already occupied.',
      }));
      continue;
    }

    return parsed;
  }
};

const printState = (io: CliIO, state: GameState, moveResponse?: MoveResponse) => {
  io.print(formatBoard(state.board));
  if (moveResponse?.aiRationale) {
    io.print(`AI rationale: ${moveResponse.aiRationale}`);
  }
  io.print(formatStatus(state));
};

export const runPlay = async (options: {
  apiClient: ApiClient;
  io: CliIO;
  startingPlayer: PlayerSymbol;
  opponentId: string;
}): Promise<number> => {
  const { apiClient, io, startingPlayer, opponentId } = options;

  io.print('Starting new game...');
  const newGameResult = await apiClient.newGame({ startingPlayer, opponentId });
  if (!newGameResult.ok) {
    io.print(formatError(newGameResult.error));
    return 1;
  }

  let currentState = newGameResult.data;
  printState(io, currentState);

  while (currentState.gameStatus === 'in_progress') {
    const moveIndex = await promptForMove(io, currentState);
    const moveResult = await apiClient.move({ state: currentState, playerMoveIndex: moveIndex });

    if (!moveResult.ok) {
      io.print(formatError(moveResult.error));
      return 1;
    }

    currentState = moveResult.data.state;
    printState(io, currentState, moveResult.data);
  }

  return 0;
};

export const runCli = async (
  argv: string[],
  deps: { io?: CliIO; apiClient?: ApiClient } = {},
): Promise<number> => {
  const io = deps.io ?? createConsoleIO();

  try {
    const parsed = parseArgs(argv);
    if (!parsed.ok) {
      io.print(formatError(parsed.error));
      io.print(parsed.usage);
      return 1;
    }

    const apiClient = deps.apiClient ?? createCliClient({ baseUrl: parsed.args.apiBaseUrl });

    return runPlay({
      apiClient,
      io,
      startingPlayer: parsed.args.startingPlayer,
      opponentId: parsed.args.opponentId,
    });
  } finally {
    io.close?.();
  }
};
