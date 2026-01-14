import cors from '@fastify/cors';
import Fastify, { type FastifyReply } from 'fastify';

import {
  ErrorResponseSchema,
  GameStateSchema,
  MoveRequestSchema,
  MoveResponseSchema,
  NewGameRequestSchema,
} from '../shared';
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

export const buildApp = () => {
  const app = Fastify({ logger: true });
  const gameService = createGameService();

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

    const result = gameService.applyPlayerMove(parsed.data.state, parsed.data.playerMoveIndex);
    if ('errorCode' in result) {
      const statusCode = result.errorCode === 'TERMINAL_STATE' ? 409 : 400;
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
