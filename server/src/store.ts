import type { GamePersistence } from "./persistence.js";

export type GameStatus = "waiting" | "active" | "over";

export type PlayerMark = "X" | "O";
export type Cell = PlayerMark | null;

export type GameRecord = {
  id: string;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
  lastMoveAt: string;
  moveCount: number;
  players: { id: string; mark: PlayerMark }[];
  currentTurn: PlayerMark;
  moves: { index: number; mark: PlayerMark; turn: number; at: string }[];
  board: Cell[];
  winner: PlayerMark | null;
};

const MAX_GAMES = 25;
const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function detectWinner(board: Cell[]): PlayerMark | null {
  for (const [a, b, c] of WINNING_LINES) {
    const cell = board[a];
    if (cell && cell === board[b] && cell === board[c]) {
      return cell;
    }
  }
  return null;
}

export class GameStore {
  private games = new Map<string, GameRecord>();

  constructor(private persistence: GamePersistence | null = null) {}

  async hydrate(): Promise<void> {
    if (!this.persistence) {
      return;
    }
    const games = await this.persistence.listAll();
    for (const game of games) {
      this.games.set(game.id, game);
    }
  }

  private async persist(game: GameRecord): Promise<void> {
    if (!this.persistence) {
      return;
    }
    await this.persistence.save(game);
  }

  reset(): void {
    this.games.clear();
  }

  async setLastMoveAt(id: string, lastMoveAt: string): Promise<void> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error("NOT_FOUND");
    }
    const updated: GameRecord = {
      ...game,
      lastMoveAt,
      updatedAt: lastMoveAt,
    };
    this.games.set(id, updated);
    await this.persist(updated);
  }

  getActiveCount(): number {
    let count = 0;
    for (const game of this.games.values()) {
      if (game.status === "waiting" || game.status === "active") {
        count += 1;
      }
    }
    return count;
  }

  canCreate(): boolean {
    return this.getActiveCount() < MAX_GAMES;
  }

  async createGame(creatorId?: string): Promise<GameRecord> {
    if (!this.canCreate()) {
      throw new Error("MAX_GAMES_REACHED");
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const game: GameRecord = {
      id,
      status: "waiting",
      createdAt: now,
      updatedAt: now,
      lastMoveAt: now,
      moveCount: 0,
      players: creatorId ? [{ id: creatorId, mark: "X" }] : [],
      currentTurn: "X",
      moves: [],
      board: Array.from({ length: 9 }, () => null),
      winner: null,
    };

    this.games.set(id, game);
    await this.persist(game);
    return game;
  }

  listGames(status?: GameStatus): GameRecord[] {
    const results: GameRecord[] = [];
    for (const game of this.games.values()) {
      if (!status || game.status === status) {
        results.push({
          ...game,
          players: [...game.players],
          moves: [...game.moves],
          board: [...game.board],
        });
      }
    }
    return results;
  }

  getGame(id: string): GameRecord | null {
    return this.games.get(id) ?? null;
  }

  async joinGame(id: string, playerId: string): Promise<GameRecord> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error("NOT_FOUND");
    }

    if (game.status !== "waiting") {
      throw new Error("NOT_JOINABLE");
    }

    if (game.players.length >= 2) {
      throw new Error("NOT_JOINABLE");
    }

    const now = new Date().toISOString();
    const creator = game.players[0]?.id ?? "creator";
    const players = [
      { id: creator, mark: "X" as const },
      { id: playerId, mark: "O" as const },
    ];

    const updated: GameRecord = {
      ...game,
      status: "active",
      updatedAt: now,
      lastMoveAt: now,
      players,
      currentTurn: "X",
    };

    this.games.set(id, updated);
    await this.persist(updated);
    return updated;
  }

  async applyMove(id: string, playerId: string, index: number): Promise<GameRecord> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error("NOT_FOUND");
    }

    if (game.status !== "active") {
      throw new Error("GAME_NOT_ACTIVE");
    }

    if (!Number.isInteger(index) || index < 0 || index > 8) {
      throw new Error("INVALID_INDEX");
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("PLAYER_NOT_IN_GAME");
    }

    if (player.mark !== game.currentTurn) {
      throw new Error("NOT_YOUR_TURN");
    }

    if (game.board[index] !== null) {
      throw new Error("CELL_OCCUPIED");
    }

    const now = new Date().toISOString();
    const turn = game.moveCount + 1;
    const moves = [
      ...game.moves,
      { index, mark: player.mark, turn, at: now },
    ];
    const board = [...game.board];
    board[index] = player.mark;

    const winner = detectWinner(board);
    const isDraw = !winner && turn >= 9;
    const status: GameStatus = winner || isDraw ? "over" : "active";

    const updated: GameRecord = {
      ...game,
      moves,
      board,
      moveCount: turn,
      updatedAt: now,
      lastMoveAt: now,
      currentTurn: game.currentTurn === "X" ? "O" : "X",
      status,
      winner,
    };

    this.games.set(id, updated);
    await this.persist(updated);
    return updated;
  }

  async resignGame(id: string, playerId: string): Promise<GameRecord> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error("NOT_FOUND");
    }

    if (game.status !== "active") {
      throw new Error("GAME_NOT_ACTIVE");
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("PLAYER_NOT_IN_GAME");
    }

    const winner: PlayerMark = player.mark === "X" ? "O" : "X";
    const now = new Date().toISOString();
    const updated: GameRecord = {
      ...game,
      status: "over",
      winner,
      updatedAt: now,
      lastMoveAt: now,
      currentTurn: winner,
    };

    this.games.set(id, updated);
    await this.persist(updated);
    return updated;
  }

  async checkAbandonment(
    id: string,
    playerId: string,
    now = new Date()
  ): Promise<{
    abandoned: boolean;
    reason: "ABANDONED" | "NOT_INACTIVE" | "YOUR_TURN";
    game: GameRecord;
  }> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error("NOT_FOUND");
    }

    if (game.status !== "active") {
      throw new Error("GAME_NOT_ACTIVE");
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("PLAYER_NOT_IN_GAME");
    }

    const current = game.players.find((p) => p.mark === game.currentTurn);
    if (!current) {
      throw new Error("PLAYER_NOT_IN_GAME");
    }

    if (current.id === playerId) {
      return { abandoned: false, reason: "YOUR_TURN", game };
    }

    const thresholdMs = 3 * 60 * 1000;
    const lastMoveTime = Date.parse(game.lastMoveAt);
    const elapsed = now.getTime() - lastMoveTime;
    if (elapsed < thresholdMs) {
      return { abandoned: false, reason: "NOT_INACTIVE", game };
    }

    const winner: PlayerMark = current.mark === "X" ? "O" : "X";
    const nowIso = now.toISOString();
    const updated: GameRecord = {
      ...game,
      status: "over",
      winner,
      updatedAt: nowIso,
      lastMoveAt: nowIso,
    };
    this.games.set(id, updated);
    await this.persist(updated);

    return { abandoned: true, reason: "ABANDONED", game: updated };
  }
}
