import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { FastifyBaseLogger } from 'fastify';
import { z } from 'zod';

import { validateMove, type GameState } from '../../shared';

type AiMoveSuccess = {
  moveIndex: number;
  rationale: string;
};

type AiMoveError = {
  errorCode: 'AI_INVALID_OUTPUT' | 'AI_TIMEOUT' | 'AI_UNAVAILABLE';
  message: string;
};

export type AiMoveResult = AiMoveSuccess | AiMoveError;

export type AiMoveService = {
  getAiMove: (state: GameState, context: AiMoveContext) => Promise<AiMoveResult>;
};

type AiMoveContext = {
  logger: FastifyBaseLogger;
  requestId: string;
  sessionId?: string;
};

type OpponentProfile = {
  id: string;
  label: string;
  promptStyle: string;
};

const opponentProfiles: OpponentProfile[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    promptStyle:
      'Play solidly. Take a winning move if available, otherwise block immediate losses. Prefer the center early.',
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    promptStyle:
      'Play to pressure the opponent. Take a winning move if available, otherwise block immediate losses. Prefer corners early.',
  },
  {
    id: 'defensive',
    label: 'Defensive',
    promptStyle:
      'Play safely. Take a winning move if available, otherwise block immediate losses. Prefer the center early.',
  },
];

export const getOpponentProfile = (opponentId: string): OpponentProfile | null =>
  opponentProfiles.find((profile) => profile.id === opponentId) ?? null;

const aiMoveSchema = z
  .object({
    moveIndex: z.number().int().min(0).max(8),
    rationale: z.string().optional().default(''),
  })
  .strict();

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const findWinningMove = (board: GameState['board'], player: GameState['nextPlayer']) => {
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== null) {
      continue;
    }

    const nextBoard = board.slice();
    nextBoard[index] = player;

    for (const [a, b, c] of winningLines) {
      const value = nextBoard[a];
      if (value && value === nextBoard[b] && value === nextBoard[c]) {
        return index;
      }
    }
  }

  return null;
};

export const getMustDoMove = (opponentId: string, state: GameState): number | null => {
  if (!getOpponentProfile(opponentId)) {
    return null;
  }

  const winningMove = findWinningMove(state.board, state.nextPlayer);
  if (winningMove !== null) {
    return winningMove;
  }

  const opponent = state.nextPlayer === 'X' ? 'O' : 'X';
  const blockingMove = findWinningMove(state.board, opponent);
  if (blockingMove !== null) {
    return blockingMove;
  }

  return null;
};

const createBedrockClient = (region: string) => new BedrockRuntimeClient({ region });

const buildPrompt = (state: GameState, profile: OpponentProfile) => {
  const boardIndexGuide = `0 | 1 | 2\n3 | 4 | 5\n6 | 7 | 8`;
  const boardState = JSON.stringify(state.board);
  const moveHistory = state.moveHistory ? JSON.stringify(state.moveHistory) : '[]';

  return [
    'You are an AI playing Tic-Tac-Toe.',
    `You play as "${state.nextPlayer}" and the opponent is "${state.nextPlayer === 'X' ? 'O' : 'X'}".`,
    `Opponent profile: ${profile.label}.`,
    profile.promptStyle,
    'Rules:',
    '- The board is a 3x3 grid indexed as follows:',
    boardIndexGuide,
    `- Current board state (array of 9): ${boardState}`,
    `- Move history: ${moveHistory}`,
    'Requirements:',
    '- If you can win immediately, choose the winning move.',
    '- If the opponent can win on their next turn, block that move.',
    '- Choose a legal move that targets an empty cell.',
    'Output:',
    '- Respond with strict JSON only, no extra keys, no markdown.',
    '- Schema: {"moveIndex": number, "rationale": string}',
  ].join('\n');
};

const extractTextFromBedrock = (payload: string) => {
  const parsed = JSON.parse(payload) as { content?: Array<{ text?: string }> };
  const text = parsed.content?.[0]?.text;

  if (!text) {
    throw new Error('missing model text response');
  }

  return text.trim();
};

const parseAiMove = (rawText: string) => {
  const parsedJson = JSON.parse(rawText) as unknown;
  return aiMoveSchema.parse(parsedJson);
};

const buildInvalidOutputError = (): AiMoveError => ({
  errorCode: 'AI_INVALID_OUTPUT',
  message: 'AI returned invalid output',
});

const buildTimeoutError = (): AiMoveError => ({
  errorCode: 'AI_TIMEOUT',
  message: 'AI request timed out',
});

const buildUnavailableError = (): AiMoveError => ({
  errorCode: 'AI_UNAVAILABLE',
  message: 'AI service is unavailable',
});

const isAbortError = (error: unknown) =>
  error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));

export const createAiMoveService = (
  deps: {
    bedrockClient?: BedrockRuntimeClient;
    modelId?: string;
    region?: string;
    timeoutMs?: number;
  } = {},
): AiMoveService => {
  const region = deps.region ?? process.env.BEDROCK_REGION;
  const modelId = deps.modelId ?? process.env.BEDROCK_MODEL_ID;
  const timeoutMs = deps.timeoutMs ?? 10_000;

  if (!modelId) {
    throw new Error('BEDROCK_MODEL_ID is required');
  }

  const bedrockClient = deps.bedrockClient ?? createBedrockClient(region ?? 'us-west-2');

  return {
    getAiMove: async (state, context) => {
      const profile = getOpponentProfile(state.opponentId);
      if (!profile) {
        return { errorCode: 'AI_INVALID_OUTPUT', message: 'Unknown opponent profile' };
      }

      const prompt = buildPrompt(state, profile);
      const mustDoMove = getMustDoMove(profile.id, state);

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), timeoutMs);

        try {
          const payload = JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 120,
            temperature: 0.2,
            messages: [
              {
                role: 'user',
                content: [{ type: 'text', text: prompt }],
              },
            ],
          });

          const command = new InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: new TextEncoder().encode(payload),
          });

          const response = await bedrockClient.send(command, {
            abortSignal: abortController.signal,
          });
          const responseBody = new TextDecoder().decode(response.body);
          const modelText = extractTextFromBedrock(responseBody);
          const parsedMove = parseAiMove(modelText);

          const moveValidation = validateMove(state, parsedMove.moveIndex);
          if (!moveValidation.ok) {
            context.logger.warn(
              {
                requestId: context.requestId,
                sessionId: context.sessionId,
                opponentId: state.opponentId,
                attempt,
                reason: moveValidation.message,
                outputLength: modelText.length,
              },
              'AI move rejected by rules',
            );
            if (attempt < 3) {
              continue;
            }
            return buildInvalidOutputError();
          }

          if (mustDoMove !== null && parsedMove.moveIndex !== mustDoMove) {
            context.logger.warn(
              {
                requestId: context.requestId,
                sessionId: context.sessionId,
                opponentId: state.opponentId,
                attempt,
                reason: 'must-do move not selected',
                outputLength: modelText.length,
              },
              'AI move rejected by must-do rule',
            );
            if (attempt < 3) {
              continue;
            }
            return buildInvalidOutputError();
          }

          context.logger.info(
            {
              requestId: context.requestId,
              sessionId: context.sessionId,
              opponentId: state.opponentId,
              attempt,
              moveIndex: parsedMove.moveIndex,
              rationaleLength: parsedMove.rationale.length,
            },
            'AI move accepted',
          );

          return { moveIndex: parsedMove.moveIndex, rationale: parsedMove.rationale };
        } catch (error) {
          if (isAbortError(error)) {
            context.logger.error(
              {
                requestId: context.requestId,
                sessionId: context.sessionId,
                opponentId: state.opponentId,
                attempt,
              },
              'AI request timed out',
            );
            return buildTimeoutError();
          }

          if (error instanceof SyntaxError || error instanceof z.ZodError) {
            context.logger.warn(
              {
                requestId: context.requestId,
                sessionId: context.sessionId,
                opponentId: state.opponentId,
                attempt,
              },
              'AI response was invalid JSON',
            );
            if (attempt < 3) {
              continue;
            }
            return buildInvalidOutputError();
          }

          context.logger.error(
            {
              requestId: context.requestId,
              sessionId: context.sessionId,
              opponentId: state.opponentId,
              attempt,
              error: error instanceof Error ? error.message : String(error),
            },
            'AI request failed',
          );
          return buildUnavailableError();
        } finally {
          clearTimeout(timeout);
        }
      }

      return buildInvalidOutputError();
    },
  };
};

export { opponentProfiles };
