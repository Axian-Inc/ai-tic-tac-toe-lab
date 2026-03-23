import { expect, test } from "@playwright/test";
import {
  InMemoryMultiplayerGameStore,
  appendHistoryEvent,
  createCompletionFromCurrentGame,
  toGameSnapshot,
  toGameSummary,
  validateCreateGameRequest,
  type MultiplayerGameRecord,
} from "../../server/index";

function createWaitingGame(store: InMemoryMultiplayerGameStore): MultiplayerGameRecord {
  return store.createWaitingGame("Host", "Match One");
}

function createActiveGame(store: InMemoryMultiplayerGameStore): MultiplayerGameRecord {
  const game = createWaitingGame(store);
  const joined = store.joinWaitingGame(game.id);

  expect(joined).not.toBe("not_found");
  expect(joined).not.toBe("not_joinable");

  return store.get(game.id)!;
}

function createClock(start: string) {
  let current = start;

  return {
    now: () => current,
    set: (next: string) => {
      current = next;
    },
  };
}

test.describe("server multiplayer helpers", () => {
  test("InMemoryMultiplayerGameStore.createWaitingGame creates a waiting game with host X assignment and initial history event", () => {
    const store = new InMemoryMultiplayerGameStore();

    const game = store.createWaitingGame("Host", "Match One");

    expect(game.status).toBe("waiting");
    expect(game.name).toBe("Match One");
    expect(game.players.X.name).toBe("Host");
    expect(game.players.O).toBeNull();
    expect(game.historyEvents).toEqual([
      {
        type: "game-created",
        sequence: 1,
        occurredAt: game.createdAt,
        player: "X",
      },
    ]);
    expect(game.activity).toEqual({
      lastProgressedAt: game.createdAt,
      awaitingPlayer: null,
      awaitingSince: null,
      abandonmentTimeoutMs: 180000,
      abandonmentDeadlineAt: null,
    });
  });

  test("InMemoryMultiplayerGameStore.createWaitingGame increments concurrent game count for waiting games", () => {
    const store = new InMemoryMultiplayerGameStore();

    expect(store.getConcurrentGameCount()).toBe(0);
    store.createWaitingGame("Host", "Match One");
    store.createWaitingGame("Host", "Match Two");

    expect(store.getConcurrentGameCount()).toBe(2);
  });

  test("InMemoryMultiplayerGameStore.joinWaitingGame activates a waiting game and assigns player O", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    const joined = store.joinWaitingGame(game.id);

    expect(joined).not.toBe("not_found");
    expect(joined).not.toBe("not_joinable");

    const activeGame = store.get(game.id)!;
    expect(activeGame.status).toBe("active");
    expect(activeGame.players.O).not.toBeNull();
    expect(activeGame.players.O?.player).toBe("O");
    expect(activeGame.activity.awaitingPlayer).toBe("X");
    expect(activeGame.activity.awaitingSince).toBe(activeGame.updatedAt);
    expect(activeGame.historyEvents.map((event) => event.type)).toEqual([
      "game-created",
      "player-joined",
    ]);
  });

  test("InMemoryMultiplayerGameStore.joinWaitingGame returns not_found for an unknown id", () => {
    const store = new InMemoryMultiplayerGameStore();

    expect(store.joinWaitingGame("missing-game")).toBe("not_found");
  });

  test("InMemoryMultiplayerGameStore.joinWaitingGame returns not_joinable when the game is already active", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    expect(store.joinWaitingGame(game.id)).toBe("not_joinable");
  });

  test("InMemoryMultiplayerGameStore.joinWaitingGame returns not_joinable when player O is already assigned", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    game.players.O = {
      player: "O",
      joinedAt: new Date().toISOString(),
    };

    expect(store.joinWaitingGame(game.id)).toBe("not_joinable");
  });

  test("InMemoryMultiplayerGameStore.submitMove returns not_found for an unknown id", () => {
    const store = new InMemoryMultiplayerGameStore();

    expect(store.submitMove("missing-game", "X", 0)).toBe("not_found");
  });

  test("InMemoryMultiplayerGameStore.submitMove returns not_active for waiting games", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    expect(store.submitMove(game.id, "X", 0)).toBe("not_active");
  });

  test("InMemoryMultiplayerGameStore.submitMove returns player_not_joined for an active game record without that player assigned", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    game.status = "active";

    expect(store.submitMove(game.id, "O", 0)).toBe("player_not_joined");
  });

  test("InMemoryMultiplayerGameStore.submitMove returns wrong_turn when the submitted player is not the current player", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    expect(store.submitMove(game.id, "O", 0)).toBe("wrong_turn");
  });

  test("InMemoryMultiplayerGameStore.submitMove returns invalid_move for an occupied cell", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    expect(store.submitMove(game.id, "X", 0)).not.toBe("invalid_move");
    expect(store.submitMove(game.id, "O", 0)).toBe("invalid_move");
  });

  test("InMemoryMultiplayerGameStore.submitMove returns invalid_move for an out-of-range position", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    expect(store.submitMove(game.id, "X", 9)).toBe("invalid_move");
  });

  test("InMemoryMultiplayerGameStore.submitMove applies a valid move and updates board, move history, and turn", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    const result = store.submitMove(game.id, "X", 4);

    expect(result).not.toBe("not_found");
    expect(result).not.toBe("not_active");
    expect(result).not.toBe("player_not_joined");
    expect(result).not.toBe("wrong_turn");
    expect(result).not.toBe("invalid_move");

    const updated = store.get(game.id)!;
    expect(updated.game.getBoard()[4]).toBe("X");
    expect(updated.game.getMoves()).toEqual([{ order: 1, player: "X", position: 4 }]);
    expect(updated.game.getCurrentPlayer()).toBe("O");
    expect(updated.status).toBe("active");
    expect(updated.completion).toBeNull();
    expect(updated.activity.awaitingPlayer).toBe("O");
    expect(updated.activity.awaitingSince).toBe(updated.updatedAt);
  });

  test("InMemoryMultiplayerGameStore.submitMove completes a winning game with win completion metadata and history event", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    store.submitMove(game.id, "X", 0);
    store.submitMove(game.id, "O", 3);
    store.submitMove(game.id, "X", 1);
    store.submitMove(game.id, "O", 4);
    const result = store.submitMove(game.id, "X", 2);

    expect(result).not.toBe("not_found");
    expect(result).not.toBe("not_active");
    expect(result).not.toBe("player_not_joined");
    expect(result).not.toBe("wrong_turn");
    expect(result).not.toBe("invalid_move");

    const completed = store.get(game.id)!;
    expect(completed.status).toBe("over");
    expect(completed.completion).toEqual({
      endReason: "win",
      winner: "X",
      loser: "O",
      completedAt: completed.updatedAt,
    });
    expect(completed.historyEvents.at(-1)).toEqual({
      type: "game-completed",
      sequence: 3,
      occurredAt: completed.updatedAt,
      completion: completed.completion,
    });
  });

  test("InMemoryMultiplayerGameStore.submitMove completes a drawn game with draw completion metadata and history event", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8] as const;
    const players = ["X", "O", "X", "O", "X", "O", "X", "O", "X"] as const;

    for (const [index, position] of moves.entries()) {
      const result = store.submitMove(game.id, players[index], position);
      expect(result).not.toBe("not_found");
      expect(result).not.toBe("not_active");
      expect(result).not.toBe("player_not_joined");
      expect(result).not.toBe("wrong_turn");
      expect(result).not.toBe("invalid_move");
    }

    const completed = store.get(game.id)!;
    expect(completed.status).toBe("over");
    expect(completed.completion).toEqual({
      endReason: "draw",
      winner: null,
      loser: null,
      completedAt: completed.updatedAt,
    });
    expect(completed.historyEvents.at(-1)).toEqual({
      type: "game-completed",
      sequence: 3,
      occurredAt: completed.updatedAt,
      completion: completed.completion,
    });
  });

  test("InMemoryMultiplayerGameStore.submitMove decrements concurrent game count when an active game transitions to over", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    store.submitMove(game.id, "X", 0);
    store.submitMove(game.id, "O", 3);
    store.submitMove(game.id, "X", 1);
    store.submitMove(game.id, "O", 4);

    expect(store.getConcurrentGameCount()).toBe(1);

    store.submitMove(game.id, "X", 2);

    expect(store.getConcurrentGameCount()).toBe(0);
  });

  test("InMemoryMultiplayerGameStore.resignGame returns not_found for an unknown id", () => {
    const store = new InMemoryMultiplayerGameStore();

    expect(store.resignGame("missing-game", "X")).toBe("not_found");
  });

  test("InMemoryMultiplayerGameStore.resignGame returns not_active for a waiting game", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    expect(store.resignGame(game.id, "X")).toBe("not_active");
  });

  test("InMemoryMultiplayerGameStore.resignGame returns player_not_joined for an unassigned player", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);
    game.status = "active";

    expect(store.resignGame(game.id, "O")).toBe("player_not_joined");
  });

  test("InMemoryMultiplayerGameStore.resignGame completes an active game with resignation completion metadata and history event", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    const result = store.resignGame(game.id, "X");

    expect(result).not.toBe("not_found");
    expect(result).not.toBe("not_active");
    expect(result).not.toBe("player_not_joined");

    const completed = store.get(game.id)!;
    expect(completed.status).toBe("over");
    expect(completed.completion).toEqual({
      endReason: "resignation",
      winner: "O",
      loser: "X",
      completedAt: completed.updatedAt,
    });
    expect(completed.historyEvents.at(-1)).toEqual({
      type: "game-completed",
      sequence: 3,
      occurredAt: completed.updatedAt,
      completion: completed.completion,
    });
    expect(completed.activity.awaitingPlayer).toBeNull();
    expect(completed.activity.abandonmentDeadlineAt).toBeNull();
  });

  test("InMemoryMultiplayerGameStore.noteReconnect resets the abandonment window only for the awaited player", () => {
    const clock = createClock("2026-03-23T00:00:00.000Z");
    const store = new InMemoryMultiplayerGameStore(clock.now);
    const game = store.createWaitingGame("Host", "Match One");

    clock.set("2026-03-23T00:01:00.000Z");
    store.joinWaitingGame(game.id);

    const beforeReconnect = store.get(game.id)!;
    expect(beforeReconnect.activity.awaitingPlayer).toBe("X");

    clock.set("2026-03-23T00:02:30.000Z");
    store.noteReconnect(game.id, "O");
    expect(store.get(game.id)!.activity.awaitingSince).toBe("2026-03-23T00:01:00.000Z");

    store.noteReconnect(game.id, "X");
    expect(store.get(game.id)!.activity.awaitingSince).toBe("2026-03-23T00:02:30.000Z");
  });

  test("InMemoryMultiplayerGameStore.checkAbandonment returns too_soon before the timeout expires", () => {
    const clock = createClock("2026-03-23T00:00:00.000Z");
    const store = new InMemoryMultiplayerGameStore(clock.now);
    const game = store.createWaitingGame("Host", "Match One");

    clock.set("2026-03-23T00:01:00.000Z");
    store.joinWaitingGame(game.id);
    clock.set("2026-03-23T00:03:59.000Z");

    expect(store.checkAbandonment(game.id)).toBe("too_soon");
    expect(store.get(game.id)!.status).toBe("active");
  });

  test("InMemoryMultiplayerGameStore.checkAbandonment completes the game after the timeout expires", () => {
    const clock = createClock("2026-03-23T00:00:00.000Z");
    const store = new InMemoryMultiplayerGameStore(clock.now);
    const game = store.createWaitingGame("Host", "Match One");

    clock.set("2026-03-23T00:01:00.000Z");
    store.joinWaitingGame(game.id);
    clock.set("2026-03-23T00:04:00.000Z");

    const result = store.checkAbandonment(game.id);

    expect(result).not.toBe("not_found");
    expect(result).not.toBe("not_active");
    expect(result).not.toBe("too_soon");

    const completed = store.get(game.id)!;
    expect(completed.status).toBe("over");
    expect(completed.completion).toEqual({
      endReason: "abandonment",
      winner: "O",
      loser: "X",
      completedAt: "2026-03-23T00:04:00.000Z",
    });
    expect(completed.historyEvents.at(-1)).toEqual({
      type: "game-completed",
      sequence: 3,
      occurredAt: "2026-03-23T00:04:00.000Z",
      completion: completed.completion,
    });
  });

  test("validateCreateGameRequest accepts trimmed playerName and gameName values", () => {
    expect(validateCreateGameRequest({ playerName: "  Host  ", gameName: "  Match One  " })).toEqual({
      playerName: "Host",
      gameName: "Match One",
    });
  });

  test("validateCreateGameRequest rejects an empty playerName", () => {
    expect(validateCreateGameRequest({ playerName: "  ", gameName: "Match One" })).toEqual({
      message: "Enter your player name to host a multiplayer game.",
    });
  });

  test("validateCreateGameRequest rejects an empty gameName", () => {
    expect(validateCreateGameRequest({ playerName: "Host", gameName: "   " })).toEqual({
      message: "Enter a game name to create a multiplayer game.",
    });
  });

  test("validateCreateGameRequest rejects a playerName longer than MULTIPLAYER_PLAYER_NAME_MAX_LENGTH", () => {
    expect(validateCreateGameRequest({ playerName: "X".repeat(33), gameName: "Match One" })).toEqual({
      message: "Player name must be 32 characters or fewer.",
    });
  });

  test("validateCreateGameRequest rejects a gameName longer than MULTIPLAYER_GAME_NAME_MAX_LENGTH", () => {
    expect(validateCreateGameRequest({ playerName: "Host", gameName: "M".repeat(49) })).toEqual({
      message: "Game name must be 48 characters or fewer.",
    });
  });

  test("validateCreateGameRequest normalizes non-string values to empty input and returns a validation error", () => {
    expect(validateCreateGameRequest({ playerName: 42, gameName: null })).toEqual({
      message: "Enter your player name to host a multiplayer game.",
    });
  });

  test("toGameSummary derives hostName from player X and reports one open seat for waiting games", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    expect(toGameSummary(game)).toMatchObject({
      id: game.id,
      hostName: "Host",
      openSeatCount: 1,
      status: "waiting",
    });
  });

  test("toGameSummary reports zero open seats for games with player O assigned", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    expect(toGameSummary(game).openSeatCount).toBe(0);
  });

  test("toGameSnapshot returns cloned player, completion, and history objects that cannot mutate store state", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    store.resignGame(game.id, "X");

    const snapshot = toGameSnapshot(game);
    snapshot.players.X.name = "Mutated";
    if (snapshot.players.O) {
      snapshot.players.O.joinedAt = "changed";
    }
    if (snapshot.completion) {
      snapshot.completion.completedAt = "changed";
    }
    snapshot.activity.lastProgressedAt = "changed";
    snapshot.history.events[0].sequence = 999;

    const freshSnapshot = toGameSnapshot(game);
    expect(freshSnapshot.players.X.name).toBe("Host");
    expect(freshSnapshot.players.O?.joinedAt).not.toBe("changed");
    expect(freshSnapshot.completion?.completedAt).toBe(game.updatedAt);
    expect(freshSnapshot.activity.lastProgressedAt).toBe(game.updatedAt);
    expect(freshSnapshot.history.events[0].sequence).toBe(1);
  });

  test("toGameSnapshot preserves the live shared Game state when completion is null", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    store.submitMove(game.id, "X", 4);

    const snapshot = toGameSnapshot(game);

    expect(snapshot.completion).toBeNull();
    expect(snapshot.state).toEqual(game.game.getState());
  });

  test("toGameSnapshot overrides state status from completion metadata for resignation outcomes", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    store.resignGame(game.id, "X");

    const snapshot = toGameSnapshot(game);

    expect(game.game.getStatus()).toEqual({ winner: null, isDraw: false, isOver: false });
    expect(snapshot.state.status).toEqual({ winner: "O", isDraw: false, isOver: true });
  });

  test("toGameSnapshot overrides state status from completion metadata for draw outcomes", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8] as const;
    const players = ["X", "O", "X", "O", "X", "O", "X", "O", "X"] as const;

    for (const [index, position] of moves.entries()) {
      store.submitMove(game.id, players[index], position);
    }

    const snapshot = toGameSnapshot(game);

    expect(snapshot.state.status).toEqual({ winner: null, isDraw: true, isOver: true });
  });

  test("createCompletionFromCurrentGame returns null when the shared game is still in progress", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);

    expect(createCompletionFromCurrentGame(game, new Date().toISOString())).toBeNull();
  });

  test("createCompletionFromCurrentGame returns win metadata with the correct loser", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    store.submitMove(game.id, "X", 0);
    store.submitMove(game.id, "O", 3);
    store.submitMove(game.id, "X", 1);
    store.submitMove(game.id, "O", 4);
    store.submitMove(game.id, "X", 2);

    expect(createCompletionFromCurrentGame(game, "2026-03-23T00:00:00.000Z")).toEqual({
      endReason: "win",
      winner: "X",
      loser: "O",
      completedAt: "2026-03-23T00:00:00.000Z",
    });
  });

  test("createCompletionFromCurrentGame returns draw metadata with null winner and loser", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createActiveGame(store);
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8] as const;
    const players = ["X", "O", "X", "O", "X", "O", "X", "O", "X"] as const;

    for (const [index, position] of moves.entries()) {
      store.submitMove(game.id, players[index], position);
    }

    expect(createCompletionFromCurrentGame(game, "2026-03-23T00:00:00.000Z")).toEqual({
      endReason: "draw",
      winner: null,
      loser: null,
      completedAt: "2026-03-23T00:00:00.000Z",
    });
  });

  test("appendHistoryEvent assigns monotonically increasing sequence numbers", () => {
    const store = new InMemoryMultiplayerGameStore();
    const game = createWaitingGame(store);

    appendHistoryEvent(game, {
      type: "player-joined",
      occurredAt: "2026-03-23T00:00:01.000Z",
      player: "O",
    });
    appendHistoryEvent(game, {
      type: "game-completed",
      occurredAt: "2026-03-23T00:00:02.000Z",
      completion: {
        endReason: "draw",
        winner: null,
        loser: null,
        completedAt: "2026-03-23T00:00:02.000Z",
      },
    });

    expect(game.historyEvents.map((event) => event.sequence)).toEqual([1, 2, 3]);
  });
});
