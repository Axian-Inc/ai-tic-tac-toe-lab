import { getDeterministicCpuMovePosition } from "../../../src/game/cpu";
import { Game, type BoardCell, type GameState, type Player } from "../../../src/game/Game";

export const SINGLE_PLAYER_WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export type WinningLine = (typeof SINGLE_PLAYER_WINNING_LINES)[number];

export interface PlannedSinglePlayerScenario {
  finalBoard: BoardCell[];
  finalState: GameState;
  playerMoves: number[];
  winner: Player | null;
  winningLine: WinningLine | null;
}

function cloneGame(game: Game): Game {
  return new Game(game.getState());
}

function getOpenPositions(game: Game): number[] {
  return game
    .getBoard()
    .map((cell, position) => (cell === null ? position : null))
    .filter((position): position is number => position !== null);
}

function findWinningLine(board: BoardCell[]): WinningLine | null {
  return (
    SINGLE_PLAYER_WINNING_LINES.find(
      ([a, b, c]) => board[a] !== null && board[a] === board[b] && board[a] === board[c]
    ) ?? null
  );
}

function runCpuTurn(game: Game): void {
  if (game.getCurrentPlayer() !== "O" || game.getStatus().isOver) {
    return;
  }

  const cpuMove = getDeterministicCpuMovePosition(game);

  if (cpuMove !== null) {
    game.placeMove(cpuMove);
  }
}

function toScenario(game: Game, playerMoves: number[]): PlannedSinglePlayerScenario {
  const finalState = game.getState();

  return {
    finalBoard: finalState.board,
    finalState,
    playerMoves: [...playerMoves],
    winner: finalState.status.winner,
    winningLine: findWinningLine(finalState.board),
  };
}

function searchScenario(
  predicate: (scenario: PlannedSinglePlayerScenario) => boolean,
  game = new Game(),
  playerMoves: number[] = []
): PlannedSinglePlayerScenario | null {
  const scenario = toScenario(game, playerMoves);

  if (predicate(scenario)) {
    return scenario;
  }

  if (scenario.finalState.status.isOver) {
    return null;
  }

  for (const position of getOpenPositions(game)) {
    const nextGame = cloneGame(game);

    if (!nextGame.placeMove(position)) {
      continue;
    }

    runCpuTurn(nextGame);

    const result = searchScenario(predicate, nextGame, [...playerMoves, position]);

    if (result) {
      return result;
    }
  }

  return null;
}

export function planSinglePlayerDrawScenario(): PlannedSinglePlayerScenario | null {
  return searchScenario((scenario) => scenario.finalState.status.isDraw);
}

export function planSinglePlayerCpuWinScenario(): PlannedSinglePlayerScenario | null {
  return searchScenario((scenario) => scenario.winner === "O");
}

export function planSinglePlayerPlayerWinScenario(): PlannedSinglePlayerScenario | null {
  return searchScenario((scenario) => scenario.winner === "X");
}

export function planSinglePlayerWinningLineScenario(
  winningLine: WinningLine
): PlannedSinglePlayerScenario | null {
  return searchScenario(
    (scenario) =>
      scenario.winningLine !== null &&
      scenario.winningLine.every((position, index) => position === winningLine[index])
  );
}
