import type {
  MultiplayerGameSnapshot,
  MultiplayerGameSummary,
} from "../../../src/shared/multiplayer";
import type { GameState, Player } from "../../../src/shared/game";

const DEFAULT_CREATED_AT = "2026-04-05T12:00:00.000Z";
const DEFAULT_UPDATED_AT = "2026-04-05T12:01:00.000Z";

function createBaseGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: Array.from({ length: 9 }, () => null),
    currentPlayer: "X",
    moves: [],
    status: {
      isDraw: false,
      isOver: false,
      winner: null,
    },
    ...overrides,
  };
}

function createPlayerSlot(player: Player, name: string, joinedAt = DEFAULT_CREATED_AT) {
  return {
    player,
    name,
    joinedAt,
  };
}

export function createWaitingGameSnapshot(
  overrides: Partial<MultiplayerGameSnapshot> = {}
): MultiplayerGameSnapshot {
  return {
    id: "waiting-game-1",
    name: "Waiting Match",
    status: "waiting",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_UPDATED_AT,
    hostName: "Host Player",
    openSeatCount: 1,
    players: {
      X: createPlayerSlot("X", "Host Player"),
      O: null,
    },
    state: createBaseGameState(),
    completion: null,
    history: {
      retention: {
        mode: "process-memory",
        survivesServiceRestart: false,
      },
      events: [
        {
          type: "game-created",
          occurredAt: DEFAULT_CREATED_AT,
          player: "X",
          sequence: 1,
        },
      ],
    },
    activity: {
      lastProgressedAt: DEFAULT_CREATED_AT,
      awaitingPlayer: null,
      awaitingSince: null,
      abandonmentTimeoutMs: 180000,
      abandonmentDeadlineAt: null,
    },
    ...overrides,
  };
}

export function createActiveGameSnapshot(
  overrides: Partial<MultiplayerGameSnapshot> = {}
): MultiplayerGameSnapshot {
  return {
    id: "active-game-1",
    name: "Active Match",
    status: "active",
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_UPDATED_AT,
    hostName: "Host Player",
    openSeatCount: 0,
    players: {
      X: createPlayerSlot("X", "Host Player"),
      O: createPlayerSlot("O", "Joiner Player", DEFAULT_UPDATED_AT),
    },
    state: createBaseGameState(),
    completion: null,
    history: {
      retention: {
        mode: "process-memory",
        survivesServiceRestart: false,
      },
      events: [
        {
          type: "game-created",
          occurredAt: DEFAULT_CREATED_AT,
          player: "X",
          sequence: 1,
        },
        {
          type: "player-joined",
          occurredAt: DEFAULT_UPDATED_AT,
          player: "O",
          sequence: 2,
        },
      ],
    },
    activity: {
      lastProgressedAt: DEFAULT_UPDATED_AT,
      awaitingPlayer: "X",
      awaitingSince: DEFAULT_UPDATED_AT,
      abandonmentTimeoutMs: 180000,
      abandonmentDeadlineAt: "2026-04-05T12:04:00.000Z",
    },
    ...overrides,
  };
}

export function toGameSummary(game: MultiplayerGameSnapshot): MultiplayerGameSummary {
  return {
    id: game.id,
    name: game.name,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    hostName: game.hostName,
    openSeatCount: game.openSeatCount,
  };
}
