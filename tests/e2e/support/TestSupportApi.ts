import type { MultiplayerGameSnapshot } from "../../../src/shared/multiplayer";
import {
  createAbandonmentGameSnapshot,
  createActiveGameSnapshot,
  createReplayGameSnapshot,
  createWaitingGameSnapshot,
} from "./multiplayer-test-data";

const TEST_SUPPORT_BASE_URL = "http://127.0.0.1:3001/test-support";

export type ForcedFailureTarget =
  | "create"
  | "list"
  | "detail"
  | "join"
  | "move"
  | "resign"
  | "abandonment-check";

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed with status ${response.status}.`);
  }

  return response.json().catch(() => null);
}

export class TestSupportApi {
  async reset(): Promise<void> {
    await readJson(
      await fetch(`${TEST_SUPPORT_BASE_URL}/reset`, {
        method: "POST",
      })
    );
  }

  async seedGame(game: MultiplayerGameSnapshot): Promise<void> {
    await readJson(
      await fetch(`${TEST_SUPPORT_BASE_URL}/seed/game`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ game }),
      })
    );
  }

  async seedWaitingGame(
    overrides?: Partial<MultiplayerGameSnapshot>
  ): Promise<MultiplayerGameSnapshot> {
    const game = createWaitingGameSnapshot(overrides);
    await this.seedGame(game);
    return game;
  }

  async seedActiveGame(
    overrides?: Partial<MultiplayerGameSnapshot>
  ): Promise<MultiplayerGameSnapshot> {
    const game = createActiveGameSnapshot(overrides);
    await this.seedGame(game);
    return game;
  }

  async seedReplayGame(
    overrides?: Partial<MultiplayerGameSnapshot>
  ): Promise<MultiplayerGameSnapshot> {
    const game = createReplayGameSnapshot(overrides);
    await this.seedGame(game);
    return game;
  }

  async seedAbandonmentGame(options?: {
    awaitingPlayer?: "X" | "O";
    remainingMs?: number;
    overrides?: Partial<MultiplayerGameSnapshot>;
  }): Promise<MultiplayerGameSnapshot> {
    const game = createAbandonmentGameSnapshot(options);
    await this.seedGame(game);
    return game;
  }

  async seedStaleJoin(options?: {
    gameId?: string;
    gameName?: string;
    hostName?: string;
  }): Promise<void> {
    await readJson(
      await fetch(`${TEST_SUPPORT_BASE_URL}/seed/stale-join`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(options ?? {}),
      })
    );
  }

  async seedCapacity(count = 25): Promise<void> {
    await readJson(
      await fetch(`${TEST_SUPPORT_BASE_URL}/seed/capacity`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ count }),
      })
    );
  }

  async forceFailure(
    target: ForcedFailureTarget,
    statusCode: number,
    message: string
  ): Promise<void> {
    await readJson(
      await fetch(`${TEST_SUPPORT_BASE_URL}/force-failure`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          target,
          statusCode,
          message,
        }),
      })
    );
  }

  async clearForcedFailure(target: ForcedFailureTarget): Promise<void> {
    await readJson(
      await fetch(`${TEST_SUPPORT_BASE_URL}/force-failure/${target}`, {
        method: "DELETE",
      })
    );
  }
}
