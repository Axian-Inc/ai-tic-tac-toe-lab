import { expect, test } from "@playwright/test";
import { Game } from "../../src/game/Game";
import { buildMultiplayerReplayFrames } from "../../src/multiplayer/replay";
import type { MultiplayerGameSnapshot } from "../../src/shared/multiplayer";

function createSnapshot(moves: number[]): MultiplayerGameSnapshot {
  const game = new Game();

  for (const position of moves) {
    game.placeMove(position);
  }

  return {
    id: "game-1",
    name: "Match One",
    status: game.getStatus().isOver ? "over" : moves.length >= 2 ? "active" : "waiting",
    createdAt: "2026-03-23T00:00:00.000Z",
    updatedAt: "2026-03-23T00:00:00.000Z",
    hostName: "Host",
    openSeatCount: moves.length >= 2 ? 0 : 1,
    players: {
      X: { player: "X", name: "Host", joinedAt: "2026-03-23T00:00:00.000Z" },
      O:
        moves.length >= 2
          ? { player: "O", name: "Guest", joinedAt: "2026-03-23T00:01:00.000Z" }
          : null,
    },
    state: game.getState(),
    completion: null,
    history: {
      retention: { mode: "process-memory", survivesServiceRestart: false },
      events: [],
    },
  };
}

test.describe("buildMultiplayerReplayFrames", () => {
  test("returns a start frame for an empty game snapshot", () => {
    const snapshot = createSnapshot([]);

    expect(buildMultiplayerReplayFrames(snapshot)).toEqual([
      {
        key: "start",
        label: "Start",
        description: "Empty board before the first move.",
        moveCount: 0,
        state: snapshot.state,
      },
    ]);
  });

  test("sorts moves by order before generating frames", () => {
    const snapshot = createSnapshot([0, 4, 8]);
    snapshot.state.moves = [snapshot.state.moves[2], snapshot.state.moves[0], snapshot.state.moves[1]];

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames.map((frame) => frame.key)).toEqual(["start", "move-1", "move-2", "move-3"]);
    expect(frames[1].state.board[0]).toBe("X");
    expect(frames[2].state.board[4]).toBe("O");
    expect(frames[3].state.board[8]).toBe("X");
  });

  test("builds one frame per move with stable labels and descriptions", () => {
    const snapshot = createSnapshot([0, 4]);

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames[1]).toMatchObject({
      key: "move-1",
      label: "Move 1",
      description: "Player X placed a mark on cell 1.",
      moveCount: 1,
    });
    expect(frames[2]).toMatchObject({
      key: "move-2",
      label: "Move 2",
      description: "Player O placed a mark on cell 5.",
      moveCount: 2,
    });
  });

  test("does not add a duplicate final frame when replayed state matches the latest snapshot", () => {
    const snapshot = createSnapshot([0, 4, 8]);

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames).toHaveLength(4);
    expect(frames.at(-1)?.key).toBe("move-3");
  });

  test("adds a Latest frame when the authoritative state differs from the replayed move reconstruction", () => {
    const snapshot = createSnapshot([0]);
    snapshot.state.board[4] = "O";
    snapshot.state.currentPlayer = "X";

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames.at(-1)).toMatchObject({
      key: "latest",
      label: "Latest",
      description: "Current authoritative live state.",
      moveCount: 1,
      state: snapshot.state,
    });
  });

  test("adds a Result frame for a resignation completion with resignation description", () => {
    const snapshot = createSnapshot([0, 4]);
    snapshot.status = "over";
    snapshot.completion = {
      endReason: "resignation",
      winner: "O",
      loser: "X",
      completedAt: "2026-03-23T00:05:00.000Z",
    };
    snapshot.state.status = { winner: "O", isDraw: false, isOver: true };

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames.at(-1)).toMatchObject({
      key: "completed",
      label: "Result",
      description: "Game ended by resignation. Player X resigned.",
    });
  });

  test("uses the final move frame for a draw completion when replay reconstruction already matches the authoritative result", () => {
    const snapshot = createSnapshot([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    snapshot.completion = {
      endReason: "draw",
      winner: null,
      loser: null,
      completedAt: "2026-03-23T00:05:00.000Z",
    };

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames).toHaveLength(10);
    expect(frames.at(-1)).toMatchObject({
      key: "move-9",
      label: "Move 9",
      description: "Player X placed a mark on cell 9.",
    });
  });

  test("uses the final move frame for a win completion when replay reconstruction already matches the authoritative result", () => {
    const snapshot = createSnapshot([0, 3, 1, 4, 2]);
    snapshot.completion = {
      endReason: "win",
      winner: "X",
      loser: "O",
      completedAt: "2026-03-23T00:05:00.000Z",
    };
    snapshot.state.status = { winner: "X", isDraw: false, isOver: true };

    const frames = buildMultiplayerReplayFrames(snapshot);

    expect(frames).toHaveLength(6);
    expect(frames.at(-1)).toMatchObject({
      key: "move-5",
      label: "Move 5",
      description: "Player X placed a mark on cell 3.",
    });
  });
});
