import { randomUUID } from 'node:crypto';
import {
  ABANDONMENT_TIMEOUT_MS,
  MAX_CONCURRENT_MULTIPLAYER_GAMES,
  type AbandonmentCheckRequest,
  type AbandonmentCheckResponse,
  type BoardCellValue,
  type CreateGameResponse,
  type GameAbandonedEvent,
  type GameSnapshotEvent,
  type GameResignedEvent,
  type JoinGameResponse,
  type ListGamesRequest,
  type ListGamesResponse,
  type MultiplayerGameEndReason,
  type MultiplayerGameId,
  type MultiplayerGameState,
  type MultiplayerGameStatus,
  type MultiplayerGameSummary,
  type MultiplayerParticipantSeat,
  type MultiplayerPlayerMark,
  type MultiplayerServerEvent,
  type PlayerJoinedEvent,
  type ResignGameRequest,
  type ResignGameResponse,
  type SubmitMoveRequest,
  type SubmitMoveResponse,
} from '../../shared/contracts';
import { canPlayMove, createEmptyGameState, createGameState, type GameState } from '../../src/features/game/model';

type ActiveRole = 'host' | 'guest';
type Clock = () => Date;

interface StoredGame {
  readonly id: MultiplayerGameId;
  readonly createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
  abandonmentDeadlineAt: string | null;
  readonly host: MultiplayerParticipantSeat;
  guest: MultiplayerParticipantSeat | null;
  moves: StoredMove[];
  sequence: number;
  forcedOutcome: {
    readonly reason: Extract<MultiplayerGameEndReason, 'resigned' | 'abandoned'>;
    readonly winner: MultiplayerPlayerMark;
  } | null;
}

interface StoredMove {
  readonly position: number;
  readonly acceptedAt: string;
}

type MultiplayerEventListener = (event: MultiplayerServerEvent) => void;

export class MultiplayerService {
  private readonly games = new Map<MultiplayerGameId, StoredGame>();
  private readonly listeners = new Set<MultiplayerEventListener>();

  constructor(private readonly clock: Clock = () => new Date()) {}

  createGame(): CreateGameResponse {
    if (this.countConcurrentGames() >= MAX_CONCURRENT_MULTIPLAYER_GAMES) {
      throw new HttpError(429, `Concurrent game limit of ${MAX_CONCURRENT_MULTIPLAYER_GAMES} reached.`);
    }

    const now = this.clock().toISOString();
    const host = createSeat('host', 'X', now);
    const game: StoredGame = {
      id: createOpaqueId('game'),
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      endedAt: null,
      lastMoveAt: null,
      abandonmentDeadlineAt: null,
      host,
      guest: null,
      moves: [],
      sequence: 0,
      forcedOutcome: null,
    };

    this.games.set(game.id, game);

    const snapshot = toSnapshot(game);
    const event = this.createSnapshotEvent(game, snapshot, 'initial');

    const response = {
      game: snapshot,
      participant: host,
      event,
    };

    this.emit(event);
    return response;
  }

  listGames(request: ListGamesRequest = {}): ListGamesResponse {
    const games = [...this.games.values()]
      .map((game) => toSummary(game))
      .filter((game) => (request.status ? game.status === request.status : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return { games };
  }

  getGame(gameId: MultiplayerGameId): MultiplayerGameState {
    return toSnapshot(this.requireGame(gameId));
  }

  joinGame(gameId: MultiplayerGameId): JoinGameResponse {
    const game = this.requireGame(gameId);

    if (game.guest !== null || game.forcedOutcome !== null || this.deriveStatus(game) !== 'waiting') {
      throw new HttpError(409, 'Game is not available to join.');
    }

    const now = this.clock().toISOString();
    const guest = createSeat('guest', 'O', now);
    game.guest = guest;
    game.startedAt = now;
    game.updatedAt = now;
    game.abandonmentDeadlineAt = toDeadline(now);

    const snapshot = toSnapshot(game);
    const event = this.createPlayerJoinedEvent(game, snapshot);

    const response = {
      game: snapshot,
      participant: guest,
      event,
    };

    this.emit(event);
    return response;
  }

  submitMove(gameId: MultiplayerGameId, request: SubmitMoveRequest): SubmitMoveResponse {
    const game = this.requireGame(gameId);
    const state = this.requirePlayableGame(game, request.sessionId);
    const expectedTurn = game.moves.length + 1;

    if (request.expectedTurn !== expectedTurn) {
      throw new HttpError(409, `Expected turn ${expectedTurn}.`);
    }

    if (!canPlayMove(state, request.position)) {
      throw new HttpError(409, 'Requested move is not legal.');
    }

    const now = this.clock().toISOString();
    game.moves.push({
      position: request.position,
      acceptedAt: now,
    });

    const nextState = createGameState(getMovePositions(game));
    game.updatedAt = now;
    game.lastMoveAt = now;
    game.endedAt = nextState.isGameOver ? now : null;
    game.abandonmentDeadlineAt = nextState.isGameOver ? null : toDeadline(now);

    const snapshot = toSnapshot(game);
    const move = snapshot.moves.at(-1);

    if (!move) {
      throw new HttpError(500, 'Accepted move was not recorded.');
    }

    const event = this.createMoveAcceptedEvent(game, snapshot, move);

    const response = {
      game: snapshot,
      event,
    };

    this.emit(event);
    return response;
  }

  resignGame(gameId: MultiplayerGameId, request: ResignGameRequest): ResignGameResponse {
    const game = this.requireGame(gameId);
    const role = this.resolveRole(game, request.sessionId);

    if (role === null) {
      throw new HttpError(403, 'Unknown player session.');
    }

    if (this.deriveStatus(game) === 'over') {
      throw new HttpError(409, 'Game is already over.');
    }

    if (game.guest === null) {
      throw new HttpError(409, 'Cannot resign before a guest joins.');
    }

    const winner = role === 'host' ? 'O' : 'X';
    const now = this.clock().toISOString();

    game.forcedOutcome = {
      reason: 'resigned',
      winner,
    };
    game.updatedAt = now;
    game.endedAt = now;
    game.abandonmentDeadlineAt = null;

    const snapshot = toSnapshot(game);
    const event = this.createResignedEvent(game, snapshot, role, winner);

    const response = {
      game: snapshot,
      event,
    };

    this.emit(event);
    return response;
  }

  checkAbandonment(gameId: MultiplayerGameId, request: AbandonmentCheckRequest): AbandonmentCheckResponse {
    const game = this.requireGame(gameId);
    const role = this.resolveRole(game, request.sessionId);

    if (role === null) {
      throw new HttpError(403, 'Unknown player session.');
    }

    const snapshot = toSnapshot(game);
    if (snapshot.status !== 'active' || game.abandonmentDeadlineAt === null) {
      return {
        game: snapshot,
        wasAbandoned: false,
        event: null,
      };
    }

    const observedAt = request.observedAt ? new Date(request.observedAt) : this.clock();
    if (Number.isNaN(observedAt.valueOf())) {
      throw new HttpError(400, 'observedAt must be a valid ISO timestamp.');
    }

    if (observedAt.toISOString() < game.abandonmentDeadlineAt) {
      return {
        game: snapshot,
        wasAbandoned: false,
        event: null,
      };
    }

    const winner = snapshot.currentPlayer === 'X' ? 'O' : 'X';
    const abandonedRole = winner === 'X' ? 'guest' : 'host';
    const now = observedAt.toISOString();

    game.forcedOutcome = {
      reason: 'abandoned',
      winner,
    };
    game.updatedAt = now;
    game.endedAt = now;
    game.abandonmentDeadlineAt = null;

    const abandonedSnapshot = toSnapshot(game);
    const event = this.createAbandonedEvent(game, abandonedSnapshot, abandonedRole, winner);

    const response = {
      game: abandonedSnapshot,
      wasAbandoned: true,
      event,
    };

    this.emit(event);
    return response;
  }

  createResyncSnapshotEvent(gameId: MultiplayerGameId): GameSnapshotEvent {
    const game = this.requireGame(gameId);
    const snapshot = toSnapshot(game);

    return {
      eventId: createOpaqueId('event'),
      gameId: game.id,
      sequence: game.sequence,
      occurredAt: this.clock().toISOString(),
      type: 'game.snapshot',
      reason: 'resync',
      game: snapshot,
    };
  }

  subscribe(listener: MultiplayerEventListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private requireGame(gameId: MultiplayerGameId): StoredGame {
    const game = this.games.get(gameId);

    if (!game) {
      throw new HttpError(404, 'Game was not found.');
    }

    return game;
  }

  private requirePlayableGame(game: StoredGame, sessionId: string): GameState {
    if (game.guest === null) {
      throw new HttpError(409, 'Game is still waiting for a guest.');
    }

    const snapshot = toSnapshot(game);
    if (snapshot.status !== 'active') {
      throw new HttpError(409, 'Game is not active.');
    }

    const role = this.resolveRole(game, sessionId);
    if (role === null) {
      throw new HttpError(403, 'Unknown player session.');
    }

    const expectedRole = snapshot.currentPlayer === 'X' ? 'host' : 'guest';
    if (role !== expectedRole) {
      throw new HttpError(403, 'It is not this player session\'s turn.');
    }

    return createGameState(getMovePositions(game));
  }

  private resolveRole(game: StoredGame, sessionId: string): ActiveRole | null {
    if (game.host.sessionId === sessionId) {
      return 'host';
    }

    if (game.guest?.sessionId === sessionId) {
      return 'guest';
    }

    return null;
  }

  private createSnapshotEvent(
    game: StoredGame,
    snapshot: MultiplayerGameState,
    reason: 'initial' | 'resync',
  ): GameSnapshotEvent {
    return {
      eventId: createOpaqueId('event'),
      gameId: game.id,
      sequence: ++game.sequence,
      occurredAt: this.clock().toISOString(),
      type: 'game.snapshot',
      reason,
      game: snapshot,
    };
  }

  private createPlayerJoinedEvent(game: StoredGame, snapshot: MultiplayerGameState): PlayerJoinedEvent {
    return {
      eventId: createOpaqueId('event'),
      gameId: game.id,
      sequence: ++game.sequence,
      occurredAt: this.clock().toISOString(),
      type: 'game.player.joined',
      role: 'guest',
      game: snapshot,
    };
  }

  private createMoveAcceptedEvent(
    game: StoredGame,
    snapshot: MultiplayerGameState,
    move: MultiplayerGameState['moves'][number],
  ): MultiplayerServerEvent {
    return {
      eventId: createOpaqueId('event'),
      gameId: game.id,
      sequence: ++game.sequence,
      occurredAt: this.clock().toISOString(),
      type: 'game.move.accepted',
      move,
      game: snapshot,
    };
  }

  private createResignedEvent(
    game: StoredGame,
    snapshot: MultiplayerGameState,
    role: ActiveRole,
    winner: MultiplayerPlayerMark,
  ): GameResignedEvent {
    return {
      eventId: createOpaqueId('event'),
      gameId: game.id,
      sequence: ++game.sequence,
      occurredAt: this.clock().toISOString(),
      type: 'game.resigned',
      role,
      winner,
      game: snapshot,
    };
  }

  private createAbandonedEvent(
    game: StoredGame,
    snapshot: MultiplayerGameState,
    abandonedRole: ActiveRole,
    winner: MultiplayerPlayerMark,
  ): GameAbandonedEvent {
    return {
      eventId: createOpaqueId('event'),
      gameId: game.id,
      sequence: ++game.sequence,
      occurredAt: this.clock().toISOString(),
      type: 'game.abandoned',
      abandonedRole,
      winner,
      game: snapshot,
    };
  }

  private deriveStatus(game: StoredGame): MultiplayerGameStatus {
    return toSnapshot(game).status;
  }

  private emit(event: MultiplayerServerEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private countConcurrentGames(): number {
    return [...this.games.values()].filter((game) => {
      const status = this.deriveStatus(game);
      return status === 'waiting' || status === 'active';
    }).length;
  }
}

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function createSeat(role: ActiveRole, player: MultiplayerPlayerMark, joinedAt: string): MultiplayerParticipantSeat {
  return {
    role,
    player,
    sessionId: createOpaqueId('session'),
    joinedAt,
  };
}

function createOpaqueId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}

function toDeadline(now: string): string {
  return new Date(new Date(now).valueOf() + ABANDONMENT_TIMEOUT_MS).toISOString();
}

function toSummary(game: StoredGame): MultiplayerGameSummary {
  const snapshot = toSnapshot(game);

  return {
    id: snapshot.id,
    status: snapshot.status,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
    moveCount: snapshot.moves.length,
    hostJoined: true,
    guestJoined: snapshot.players.guest !== null,
    winner: snapshot.winner,
    endReason: snapshot.endReason,
  };
}

function toSnapshot(game: StoredGame): MultiplayerGameState {
  const baseState = game.moves.length > 0 ? createGameState(getMovePositions(game)) : createEmptyGameState();
  const status = deriveSnapshotStatus(game, baseState);
  const endReason = deriveEndReason(game, baseState, status);
  const winner = deriveWinner(game, baseState);

  return {
    id: game.id,
    status,
    board: [...baseState.board] as readonly BoardCellValue[],
    currentPlayer: status === 'active' ? baseState.currentPlayer : null,
    winner,
    winningLine: baseState.winningLine,
    endReason,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    startedAt: game.startedAt,
    endedAt: status === 'over' ? game.endedAt : null,
    lastMoveAt: game.lastMoveAt,
    abandonmentDeadlineAt: status === 'active' ? game.abandonmentDeadlineAt : null,
    replayCursor: game.moves.length,
    players: {
      host: game.host,
      guest: game.guest,
    },
    moves: baseState.moves.map((move, index) => ({
      turn: move.turn,
      player: move.player,
      position: move.position,
      acceptedAt: game.moves[index]?.acceptedAt ?? game.updatedAt,
    })),
  };
}

function getMovePositions(game: StoredGame): number[] {
  return game.moves.map((move) => move.position);
}

function deriveSnapshotStatus(game: StoredGame, baseState: GameState): MultiplayerGameStatus {
  if (game.guest === null) {
    return 'waiting';
  }

  if (game.forcedOutcome !== null) {
    return 'over';
  }

  return baseState.isGameOver ? 'over' : 'active';
}

function deriveEndReason(
  game: StoredGame,
  baseState: GameState,
  status: MultiplayerGameStatus,
): MultiplayerGameEndReason | null {
  if (status !== 'over') {
    return null;
  }

  if (game.forcedOutcome !== null) {
    return game.forcedOutcome.reason;
  }

  return baseState.status === 'won' ? 'win' : 'draw';
}

function deriveWinner(game: StoredGame, baseState: GameState): MultiplayerPlayerMark | null {
  if (game.forcedOutcome !== null) {
    return game.forcedOutcome.winner;
  }

  return baseState.winner;
}
