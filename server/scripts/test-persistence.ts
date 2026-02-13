import { GameStore } from "../src/store.js";
import { InMemoryPersistence } from "../src/persistence.js";

async function run() {
  const persistence = new InMemoryPersistence();
  const store = new GameStore(persistence);

  const created = await store.createGame("p1");
  await store.joinGame(created.id, "p2");
  await store.applyMove(created.id, "p1", 0);

  const newStore = new GameStore(persistence);
  await newStore.hydrate();
  const loaded = newStore.getGame(created.id);
  if (!loaded) {
    throw new Error("Expected loaded game from persistence.");
  }
  if (loaded.moves.length !== 1) {
    throw new Error("Expected moves to be persisted.");
  }

  const missing = newStore.getGame("missing");
  if (missing) {
    throw new Error("Did not expect missing game.");
  }

  console.log("Persistence tests passed.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
