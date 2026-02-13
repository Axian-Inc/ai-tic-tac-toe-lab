import { GameStore } from "../src/store.js";
import { startAbandonmentSweeper } from "../src/abandonmentSweeper.js";

type Message = { gameId: string; payload: unknown };

class FakeScheduler {
  callback: (() => void) | null = null;
  cleared = false;

  setInterval(callback: () => void) {
    this.callback = callback;
    return 1;
  }

  clearInterval() {
    this.cleared = true;
  }

  async tick() {
    if (!this.callback) {
      throw new Error("Expected interval callback");
    }
    this.callback();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function run() {
  const store = new GameStore();
  const messages: Message[] = [];
  const hub = {
    broadcast: (gameId: string, payload: unknown) => {
      messages.push({ gameId, payload });
    },
  };

  const game = await store.createGame("p1");
  await store.joinGame(game.id, "p2");

  const scheduler = new FakeScheduler();
  let now = new Date("2024-01-01T00:00:00.000Z");
  await store.setLastMoveAt(game.id, now.toISOString());

  const sweeper = startAbandonmentSweeper(store, hub, {
    intervalMs: 1000,
    thresholdMs: 3 * 60 * 1000,
    now: () => now,
    scheduler,
  });

  await scheduler.tick();
  if (messages.length !== 0) {
    throw new Error("Did not expect abandonment yet");
  }

  now = new Date(now.getTime() + 4 * 60 * 1000);
  await scheduler.tick();

  const updated = store.getGame(game.id);
  if (!updated || updated.status !== "over") {
    throw new Error("Expected game to be over after sweep");
  }
  if (updated.winner !== "O") {
    throw new Error("Expected winner O after X abandoned");
  }
  if (messages.length !== 1) {
    throw new Error("Expected single abandoned broadcast");
  }

  sweeper.stop();
  if (!scheduler.cleared) {
    throw new Error("Expected sweeper to clear interval");
  }

  console.log("Abandonment sweeper tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
