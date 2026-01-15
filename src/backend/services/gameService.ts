import { randomUUID } from 'node:crypto';

import type { FastifyBaseLogger } from 'fastify';

import { applyMove, type GameState, type NewGameRequest } from '../../shared';
import {
  createAiMoveService,
  getOpponentProfile,
  type AiMoveResult,
  type AiMoveService,
} from './aiMoveService';

type MoveError = {
  errorCode: string;
  message: string;
};

type MoveResult = { state: GameState; aiRationale?: string } | MoveError;

const createEmptyBoard = () => Array(9).fill(null) as GameState['board'];

const buildAiMoveError = (result: AiMoveResult): MoveError => ({
  errorCode: result.errorCode,
  message: result.message,
});

export const createGameService = (deps: { aiMoveService?: AiMoveService } = {}) => {
  const aiMoveService = deps.aiMoveService ?? createAiMoveService();
  const newGame = (input: NewGameRequest): GameState => ({
    board: createEmptyBoard(),
    nextPlayer: input.startingPlayer,
    gameStatus: 'in_progress',
    winner: null,
    opponentId: input.opponentId,
    sessionId: randomUUID(),
  });

  const applyPlayerMove = async (
    state: GameState,
    playerMoveIndex: number,
    context: { requestId: string; sessionId?: string; logger: FastifyBaseLogger },
  ): Promise<MoveResult> => {
    const playerMove = applyMove(state, playerMoveIndex);
    if ('errorCode' in playerMove) {
      return playerMove;
    }

    if (playerMove.state.gameStatus !== 'in_progress') {
      return { state: playerMove.state };
    }

    const profile = getOpponentProfile(playerMove.state.opponentId);
    if (!profile) {
      return { errorCode: 'INVALID_INPUT', message: 'Unknown opponent profile' };
    }

    const aiMove = await aiMoveService.getAiMove(playerMove.state, context);
    if ('errorCode' in aiMove) {
      return buildAiMoveError(aiMove);
    }

    const aiMoveResult = applyMove(playerMove.state, aiMove.moveIndex);
    if ('errorCode' in aiMoveResult) {
      return { errorCode: 'INCONSISTENT_STATE', message: 'AI move was rejected' };
    }

    return { state: aiMoveResult.state, aiRationale: aiMove.rationale };
  };

  return { newGame, applyPlayerMove };
};
