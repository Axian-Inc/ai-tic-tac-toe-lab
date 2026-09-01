import type {
  GameEventFixture,
  GameSnapshotFixture,
  Mark,
  SeatSessionFixture,
} from './contract-fixtures.js';

export interface SequencedCommandFixture {
  commandId: string;
  expectedSequence: number;
}

export interface MultiplayerApiAdapter {
  create(commandId: string): Promise<SeatSessionFixture>;
  list(status: 'waiting' | 'active' | 'over'): Promise<GameSnapshotFixture[]>;
  snapshot(gameId: string): Promise<GameSnapshotFixture>;
  events(gameId: string, afterSequence: number): Promise<GameEventFixture[]>;
  join(gameId: string, command: SequencedCommandFixture): Promise<SeatSessionFixture>;
  move(
    gameId: string,
    seatToken: string,
    command: SequencedCommandFixture & { cell: number },
  ): Promise<GameEventFixture>;
  resign(
    gameId: string,
    seatToken: string,
    command: SequencedCommandFixture,
  ): Promise<GameEventFixture>;
  checkAbandonment(
    gameId: string,
    seatToken: string,
    command: SequencedCommandFixture,
  ): Promise<GameEventFixture>;
}

export interface SubscriptionAcceptedFixture {
  type: 'subscription.accepted';
  requestId: string;
  gameId: string;
  throughSequence: number;
  snapshot: GameSnapshotFixture;
}

export interface GameEventStreamAdapter {
  subscribe(gameId: string, afterSequence: number): Promise<SubscriptionAcceptedFixture>;
  nextEvent(): Promise<GameEventFixture>;
  close(): Promise<void>;
}

export interface ControlledServerClock {
  readonly utcNow: string;
  advanceBy(milliseconds: number): Promise<void>;
}

export interface MultiplayerTestSystem {
  api: MultiplayerApiAdapter;
  connect(): Promise<GameEventStreamAdapter>;
  clock: ControlledServerClock;
  activeCapacity(): Promise<number>;
  dispose(): Promise<void>;
}

export interface ClientStateProbe {
  readonly gameId: string;
  readonly lastAppliedSequence: number;
  readonly renderedMoves: ReadonlyArray<{ ply: number; player: Mark; cell: number }>;
  receive(event: GameEventFixture): Promise<void>;
  reconnect(): Promise<void>;
}

export interface CapacityAttempt<T> {
  index: number;
  outcome: 'accepted' | 'capacity_exhausted';
  value?: T;
}

export async function runAtBarrier<T>(
  participantCount: number,
  operation: (index: number) => Promise<T>,
): Promise<PromiseSettledResult<T>[]> {
  if (!Number.isInteger(participantCount) || participantCount < 1) {
    throw new RangeError('participantCount must be a positive integer');
  }

  let release!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const participants = Array.from({ length: participantCount }, async (_, index) => {
    await barrier;
    return operation(index);
  });

  release();
  return Promise.allSettled(participants);
}

export function requireCapacityDistribution<T>(attempts: CapacityAttempt<T>[]): void {
  const accepted = attempts.filter(({ outcome }) => outcome === 'accepted');
  const rejected = attempts.filter(({ outcome }) => outcome === 'capacity_exhausted');
  if (attempts.length !== 26 || accepted.length !== 25 || rejected.length !== 1) {
    throw new Error(
      `Expected 25 accepted and 1 capacity_exhausted; received ${accepted.length} and ${rejected.length}`,
    );
  }
}
