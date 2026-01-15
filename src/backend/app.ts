import cors from '@fastify/cors';
import Fastify, { type FastifyReply } from 'fastify';

import {
  ErrorResponseSchema,
  GameStateSchema,
  MoveRequestSchema,
  MoveResponseSchema,
  NewGameRequestSchema,
} from '../shared';
import type { AiMoveService } from './services/aiMoveService';
import { createGameService } from './services/gameService';

type ErrorPayload = {
  errorCode: string;
  message: string;
  details?: unknown;
};

const sendError = (reply: FastifyReply, status: number, payload: ErrorPayload) => {
  const response = ErrorResponseSchema.parse(payload);
  return reply.status(status).send(response);
};

const statusForErrorCode = (errorCode: string) => {
  switch (errorCode) {
    case 'TERMINAL_STATE':
      return 409;
    case 'AI_INVALID_OUTPUT':
      return 502;
    case 'AI_TIMEOUT':
      return 504;
    case 'AI_UNAVAILABLE':
      return 503;
    default:
      return 400;
  }
};

export const buildApp = (deps: { aiMoveService?: AiMoveService } = {}) => {
  const app = Fastify({ logger: true });
  const gameService = createGameService({ aiMoveService: deps.aiMoveService });

  app.register(cors, { origin: true });

  app.post('/v1/new-game', async (request, reply) => {
    const parsed = NewGameRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      request.log.error(
        { requestId: request.id, issues: parsed.error.flatten() },
        'invalid new game payload',
      );
      return sendError(reply, 400, {
        errorCode: 'INVALID_INPUT',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }

    const state = GameStateSchema.parse(gameService.newGame(parsed.data));
    request.log.info(
      { requestId: request.id, sessionId: state.sessionId },
      'new game created',
    );
    return reply.status(200).send(state);
  });

  app.post('/v1/move', async (request, reply) => {
    const parsed = MoveRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      request.log.error(
        { requestId: request.id, issues: parsed.error.flatten() },
        'invalid move payload',
      );
      return sendError(reply, 400, {
        errorCode: 'INVALID_INPUT',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      });
    }

    const result = await gameService.applyPlayerMove(
      parsed.data.state,
      parsed.data.playerMoveIndex,
      {
        requestId: request.id,
        sessionId: parsed.data.state.sessionId,
        logger: request.log,
      },
    );
    if ('errorCode' in result) {
      const statusCode = statusForErrorCode(result.errorCode);
      request.log.error(
        { requestId: request.id, sessionId: parsed.data.state.sessionId, error: result },
        'move rejected',
      );
      return sendError(reply, statusCode, result);
    }

    const response = MoveResponseSchema.parse(result);
    request.log.info(
      { requestId: request.id, sessionId: response.state.sessionId },
      'move applied',
    );
    return reply.status(200).send(response);
  });

  return app;
};
