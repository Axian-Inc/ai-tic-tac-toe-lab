import { Game, type GameState } from "../game/Game";
import type { MultiplayerCompletion, MultiplayerGameSnapshot } from "../shared/multiplayer";

export interface MultiplayerReplayFrame {
  key: string;
  label: string;
  description: string;
  moveCount: number;
  state: GameState;
}

function areStatusesEqual(left: GameState["status"], right: GameState["status"]): boolean {
  return (
    left.winner === right.winner &&
    left.isDraw === right.isDraw &&
    left.isOver === right.isOver
  );
}

function areGameStatesEqual(left: GameState, right: GameState): boolean {
  return (
    left.currentPlayer === right.currentPlayer &&
    left.moves.length === right.moves.length &&
    left.board.every((cell, index) => cell === right.board[index]) &&
    areStatusesEqual(left.status, right.status)
  );
}

function getCompletionDescription(completion: MultiplayerCompletion): string {
  if (completion.endReason === "resignation") {
    return `Game ended by resignation. Player ${completion.loser} resigned.`;
  }

  if (completion.endReason === "abandonment") {
    return `Game ended by abandonment. Player ${completion.loser} timed out.`;
  }

  if (completion.endReason === "draw") {
    return "Game ended in a draw.";
  }

  return `Game ended with player ${completion.winner} winning.`;
}

export function buildMultiplayerReplayFrames(
  gameSnapshot: MultiplayerGameSnapshot
): MultiplayerReplayFrame[] {
  const replayGame = new Game();
  const frames: MultiplayerReplayFrame[] = [
    {
      key: "start",
      label: "Start",
      description: "Empty board before the first move.",
      moveCount: 0,
      state: replayGame.getState(),
    },
  ];

  const orderedMoves = [...gameSnapshot.state.moves].sort(
    (left, right) => left.order - right.order
  );

  for (const move of orderedMoves) {
    replayGame.placeMove(move.position);
    frames.push({
      key: `move-${move.order}`,
      label: `Move ${move.order}`,
      description: `Player ${move.player} placed a mark on cell ${move.position + 1}.`,
      moveCount: move.order,
      state: replayGame.getState(),
    });
  }

  const latestState = gameSnapshot.state;
  const finalFrame = frames[frames.length - 1];

  if (!areGameStatesEqual(finalFrame.state, latestState)) {
    frames.push({
      key: gameSnapshot.completion ? "completed" : "latest",
      label: gameSnapshot.completion ? "Result" : "Latest",
      description: gameSnapshot.completion
        ? getCompletionDescription(gameSnapshot.completion)
        : "Current authoritative live state.",
      moveCount: latestState.moves.length,
      state: latestState,
    });
  }

  return frames;
}
