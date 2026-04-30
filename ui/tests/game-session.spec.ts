import { expect, test } from "./coverage";
import { useGameSessionStore } from "../src/store/gameSession";

const withMockedRandom = <T,>(values: number[], callback: () => T): T => {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };

  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
};

test.beforeEach(() => {
  useGameSessionStore.getState().resetSession();
});

test.describe("game session store", () => {
  test("starts a session with the selected mode and confirmed player name", () => {
    withMockedRandom([0.1], () => {
      useGameSessionStore.getState().startGame("player-vs-player", "Alex99");
    });

    const state = useGameSessionStore.getState();

    expect(state.playerName).toBe("Alex99");
    expect(state.selectedMode).toBe("player-vs-player");
    expect(state.game?.mode).toBe("player-vs-player");
    expect(state.game?.moveHistory).toEqual([]);
  });

  test("plays a cell and immediately runs the CPU response when required", () => {
    withMockedRandom([0.1, 0.1], () => {
      useGameSessionStore.getState().startGame("player-vs-cpu", "Alex99");
    });

    useGameSessionStore.getState().playCell(0);

    const game = useGameSessionStore.getState().game;

    expect(game?.board[0]).toBe("X");
    expect(game?.board[4]).toBe("O");
    expect(game?.moveHistory).toEqual([
      { moveNumber: 1, playerMark: "X", cellIndex: 0 },
      { moveNumber: 2, playerMark: "O", cellIndex: 4 },
    ]);
  });

  test("changes mode by replacing the current session game", () => {
    withMockedRandom([0.1], () => {
      useGameSessionStore.getState().startGame("player-vs-player", "Alex99");
    });

    useGameSessionStore.getState().playCell(0);

    withMockedRandom([0.1, 0.1], () => {
      useGameSessionStore.getState().changeMode("player-vs-cpu");
    });

    const state = useGameSessionStore.getState();

    expect(state.selectedMode).toBe("player-vs-cpu");
    expect(state.playerName).toBe("Alex99");
    expect(state.game?.mode).toBe("player-vs-cpu");
    expect(state.game?.moveHistory).toEqual([]);
  });

  test("starts a new game without dropping the confirmed player name", () => {
    withMockedRandom([0.1], () => {
      useGameSessionStore.getState().startGame("player-vs-player", "Alex99");
    });

    useGameSessionStore.getState().playCell(0);

    withMockedRandom([0.8], () => {
      useGameSessionStore.getState().newGame();
    });

    const state = useGameSessionStore.getState();

    expect(state.playerName).toBe("Alex99");
    expect(state.game?.moveHistory).toEqual([]);
    expect(state.game?.currentPlayer).toBe("O");
  });

  test("abandons the active session game without clearing the session metadata", () => {
    withMockedRandom([0.1], () => {
      useGameSessionStore.getState().startGame("player-vs-player", "Alex99");
    });

    useGameSessionStore.getState().playCell(0);
    useGameSessionStore.getState().abandon();

    const state = useGameSessionStore.getState();

    expect(state.playerName).toBe("Alex99");
    expect(state.selectedMode).toBe("player-vs-player");
    expect(state.game?.state).toBe("abandoned");
  });
});
