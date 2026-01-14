import { randomUUID } from 'node:crypto';

import { applyMove, type GameState, type NewGameRequest } from '../../shared';

type MoveError = {
  errorCode: string;
  message: string;
};

type MoveResult = { state: GameState; aiRationale?: string } | MoveError;

type AiMove = {
  moveIndex: number;
  rationale: string;
};

const createEmptyBoard = () => Array(9).fill(null) as GameState['board'];

const pickStubAiMove = (state: GameState): AiMove | null => {
  const moveIndex = state.board.findIndex((cell) => cell === null);
  if (moveIndex === -1) {
    return null;
  }

  return {
    moveIndex,
    rationale: 'Picked the first available move (stub AI).',
  };
};

export const createGameService = () => {
  const newGame = (input: NewGameRequest): GameState => ({
    board: createEmptyBoard(),
    nextPlayer: input.startingPlayer,
    gameStatus: 'in_progress',
    winner: null,
    opponentId: input.opponentId,
    sessionId: randomUUID(),
  });

  const applyPlayerMove = (state: GameState, playerMoveIndex: number): MoveResult => {
    const playerMove = applyMove(state, playerMoveIndex);
    if ('errorCode' in playerMove) {
      return playerMove;
    }

    if (playerMove.state.gameStatus !== 'in_progress') {
      return { state: playerMove.state };
    }

    const aiMove = pickStubAiMove(playerMove.state);
    if (!aiMove) {
      return { errorCode: 'TERMINAL_STATE', message: 'game is already complete' };
    }

    const aiMoveResult = applyMove(playerMove.state, aiMove.moveIndex);
    if ('errorCode' in aiMoveResult) {
      return { errorCode: 'INCONSISTENT_STATE', message: 'AI move was rejected' };
    }

    return { state: aiMoveResult.state, aiRationale: aiMove.rationale };
  };

  return { newGame, applyPlayerMove };
};
