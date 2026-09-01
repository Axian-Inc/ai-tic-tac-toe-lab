export type Mark = 'X' | 'O';
export type MultiplayerStatus = 'waiting' | 'active' | 'over';
export type EndReason = 'line' | 'draw' | 'resignation' | 'abandonment' | 'cancelled' | null;

export interface MultiplayerMove {
  ply: number;
  player: Mark;
  cell: number;
  acceptedAt: string;
}

export interface GameSnapshot {
  id: string;
  status: MultiplayerStatus;
  sequence: number;
  board: Array<Mark | null>;
  moves: MultiplayerMove[];
  currentTurn: Mark | null;
  winner: Mark | null;
  endReason: EndReason;
  createdAt: string;
  updatedAt: string;
  turnStartedAt: string | null;
}

export interface GameEvent {
  version: 1;
  eventId: string;
  gameId: string;
  sequence: number;
  type: string;
  occurredAt: string;
  data: Record<string, unknown>;
  state: GameSnapshot;
}

export interface SeatSession {
  game: GameSnapshot;
  event: GameEvent;
  mark: Mark;
  seatToken: string;
}

export interface GameList {
  items: GameSnapshot[];
  nextCursor: string | null;
  consistency: 'eventual';
}

export interface EventPage {
  items: GameEvent[];
  nextCursor: string | null;
  throughSequence: number;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  code?: string;
  status?: number;
  currentSequence?: number;
}

export interface PlayerSession {
  gameId: string;
  mark: Mark;
  seatToken: string;
}

