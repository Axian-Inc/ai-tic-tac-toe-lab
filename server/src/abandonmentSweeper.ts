import type { GameStore } from "./store.js";
import type { WsHub } from "./ws.js";

type Scheduler = {
  setInterval: (callback: () => void, intervalMs: number) => unknown;
  clearInterval: (handle: unknown) => void;
};

type SweepOptions = {
  intervalMs?: number;
  thresholdMs?: number;
  now?: () => Date;
  scheduler?: Scheduler;
};

const DEFAULT_THRESHOLD_MS = 3 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 60 * 1000;

export async function sweepOnce(
  store: GameStore,
  hub: WsHub,
  now: Date,
  thresholdMs = DEFAULT_THRESHOLD_MS
): Promise<number> {
  const active = store.listGames("active");
  let resolved = 0;

  for (const game of active) {
    const elapsed = now.getTime() - Date.parse(game.lastMoveAt);
    if (elapsed < thresholdMs) {
      continue;
    }

    const opponent = game.players.find((p) => p.mark !== game.currentTurn);
    if (!opponent) {
      continue;
    }

    const result = await store.checkAbandonment(game.id, opponent.id, now);
    if (!result.abandoned) {
      continue;
    }

    const payload = {
      type: "abandoned",
      payload: {
        roomId: result.game.id,
        state: {
          status: result.game.status,
          board: result.game.board,
          moves: result.game.moves,
          moveCount: result.game.moveCount,
        },
        winner: result.game.winner,
        reason: "abandon",
      },
      timestamp: now.toISOString(),
    };

    hub.broadcast(result.game.id, payload);
    resolved += 1;
  }

  return resolved;
}

export function startAbandonmentSweeper(store: GameStore, hub: WsHub, options: SweepOptions = {}) {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const scheduler: Scheduler = options.scheduler ?? {
    setInterval: (callback, delay) => setInterval(callback, delay),
    clearInterval: (handle) => clearInterval(handle as NodeJS.Timeout),
  };
  const nowProvider = options.now ?? (() => new Date());
  const thresholdMs = options.thresholdMs ?? DEFAULT_THRESHOLD_MS;

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    return { stop: () => undefined };
  }

  const timer = scheduler.setInterval(() => {
    void sweepOnce(store, hub, nowProvider(), thresholdMs);
  }, intervalMs);

  return {
    stop: () => scheduler.clearInterval(timer),
  };
}
