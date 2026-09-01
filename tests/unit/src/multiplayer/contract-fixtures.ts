export type Mark = 'X' | 'O';
export type GameStatus = 'waiting' | 'active' | 'over';
export type EndReason = 'line' | 'draw' | 'resignation' | 'abandonment' | 'cancelled' | null;

export interface MoveFixture {
  ply: number;
  player: Mark;
  cell: number;
  acceptedAt: string;
}

export interface GameSnapshotFixture {
  id: string;
  status: GameStatus;
  sequence: number;
  board: Array<Mark | null>;
  moves: MoveFixture[];
  currentTurn: Mark | null;
  winner: Mark | null;
  endReason: EndReason;
  createdAt: string;
  updatedAt: string;
  turnStartedAt: string | null;
}

export interface GameEventFixture {
  version: 1;
  eventId: string;
  gameId: string;
  sequence: number;
  type:
    | 'game.created'
    | 'player.joined'
    | 'move.accepted'
    | 'game.resigned'
    | 'game.abandoned'
    | 'game.cancelled';
  occurredAt: string;
  data: Record<string, unknown>;
  state: GameSnapshotFixture;
}

export interface SeatSessionFixture {
  game: GameSnapshotFixture;
  event: GameEventFixture;
  mark: Mark;
  seatToken: string;
}

const timestamp = '2026-08-31T20:15:30.125Z';

export function waitingGameFixture(overrides: Partial<GameSnapshotFixture> = {}): GameSnapshotFixture {
  return {
    id: '01K5QX4Q6G4V8N0J57Z2Y4C8JM',
    status: 'waiting',
    sequence: 1,
    board: Array<Mark | null>(9).fill(null),
    moves: [],
    currentTurn: null,
    winner: null,
    endReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    turnStartedAt: null,
    ...overrides,
  };
}

export function eventFixture(
  state: GameSnapshotFixture = waitingGameFixture(),
  overrides: Partial<GameEventFixture> = {},
): GameEventFixture {
  return {
    version: 1,
    eventId: '01K5QX6K4B6ZEJQ4A08G3F7TCA',
    gameId: state.id,
    sequence: state.sequence,
    type: 'game.created',
    occurredAt: state.updatedAt,
    data: {},
    state,
    ...overrides,
  };
}

export function seatSessionFixture(): SeatSessionFixture {
  const game = waitingGameFixture();
  return {
    game,
    event: eventFixture(game),
    mark: 'X',
    seatToken: 'quality-fixture-seat-capability-0000000001',
  };
}

export function isSnapshot(value: unknown): value is GameSnapshotFixture {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    ['waiting', 'active', 'over'].includes(String(value.status)) &&
    Number.isInteger(value.sequence) &&
    Number(value.sequence) >= 1 &&
    Array.isArray(value.board) &&
    value.board.length === 9 &&
    value.board.every((cell) => cell === null || cell === 'X' || cell === 'O') &&
    Array.isArray(value.moves) &&
    (value.currentTurn === null || value.currentTurn === 'X' || value.currentTurn === 'O') &&
    (value.winner === null || value.winner === 'X' || value.winner === 'O') &&
    ['line', 'draw', 'resignation', 'abandonment', 'cancelled', null].includes(
      value.endReason as EndReason,
    ) &&
    isUtcMilliseconds(value.createdAt) &&
    isUtcMilliseconds(value.updatedAt) &&
    (value.turnStartedAt === null || isUtcMilliseconds(value.turnStartedAt))
  );
}

export function isGameEvent(value: unknown): value is GameEventFixture {
  if (!isRecord(value)) return false;
  return (
    value.version === 1 &&
    typeof value.eventId === 'string' &&
    typeof value.gameId === 'string' &&
    Number.isInteger(value.sequence) &&
    Number(value.sequence) >= 1 &&
    [
      'game.created',
      'player.joined',
      'move.accepted',
      'game.resigned',
      'game.abandoned',
      'game.cancelled',
    ].includes(String(value.type)) &&
    isUtcMilliseconds(value.occurredAt) &&
    isRecord(value.data) &&
    isSnapshot(value.state) &&
    value.gameId === value.state.id &&
    value.sequence === value.state.sequence
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUtcMilliseconds(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
}
