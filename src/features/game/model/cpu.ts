import {
  applyMove,
  findWinningLine,
  type GameState,
  type Player,
  togglePlayer,
} from './game';

const PRIORITY_POSITIONS = [4, 0, 2, 6, 8, 1, 3, 5, 7] as const;

export function chooseDeterministicCpuMove(
  state: GameState,
  cpuPlayer: Player = state.currentPlayer,
): number | null {
  if (state.isGameOver || state.currentPlayer !== cpuPlayer) {
    return null;
  }

  const winningMove = findFinishingMove(state, cpuPlayer);
  if (winningMove !== null) {
    return winningMove;
  }

  const blockingMove = findFinishingMove(state, togglePlayer(cpuPlayer));
  if (blockingMove !== null) {
    return blockingMove;
  }

  for (const position of PRIORITY_POSITIONS) {
    if (state.availableMoves.includes(position)) {
      return position;
    }
  }

  return null;
}

function findFinishingMove(state: GameState, player: Player): number | null {
  for (const position of state.availableMoves) {
    const candidateState =
      state.currentPlayer === player ? applyMove(state, position) : simulateMoveForPlayer(state, player, position);

    if (candidateState.winner === player && findWinningLine(candidateState.board) !== null) {
      return position;
    }
  }

  return null;
}

function simulateMoveForPlayer(state: GameState, player: Player, position: number) {
  return {
    ...applyMove(
      {
        ...state,
        currentPlayer: player,
      },
      position,
    ),
  };
}
