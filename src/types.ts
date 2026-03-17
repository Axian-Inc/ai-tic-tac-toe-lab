export type Mark = 'X' | 'O';
export type MarkSelection = Mark | 'Random';
export type BoardCell = Mark | null;
export type StartingPlayer = 'player' | 'cpu';

export interface MoveRecord {
  squareIndex: number;
  mark: Mark;
}

export interface GameSession {
  playerMark: Mark;
  cpuMark: Mark;
  selection: MarkSelection;
  startingPlayer: StartingPlayer;
  roundNumber: number;
}

export interface GameState {
  board: BoardCell[];
  currentTurn: Mark;
  moveHistory: MoveRecord[];
  phase: 'active' | 'finished';
  winner: Mark | null;
  statusText: string;
  feedbackText: string;
}

export interface GameCoreState {
  board: BoardCell[];
  currentTurn: Mark;
  moveHistory: MoveRecord[];
  phase: 'active' | 'finished';
  winner: Mark | null;
}

export type ValidationOutcome =
  | { success: true }
  | { success: false; reason: 'occupied' | 'not-turn' };

export interface WinResult {
  winner: Mark | null;
}

export type GameOutcome =
  | { status: 'active' }
  | { status: 'won'; winner: Mark }
  | { status: 'draw' };
