export const GAME_CORE_VERSION = 1 as const;

export type Mark = 'X' | 'O';
export type GameStatus = 'playing' | 'won' | 'draw' | 'quit';
export type RejectionReason =
  | 'out_of_range'
  | 'occupied'
  | 'wrong_turn'
  | 'game_over';
export type BoardCell = Mark | null;
export type Board = readonly [
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
  BoardCell,
];

export interface Move {
  readonly ply: number;
  readonly player: Mark;
  readonly cell: number;
}

export interface GameState {
  readonly board: Board;
  readonly moves: readonly Move[];
  readonly currentTurn: Mark | null;
  readonly winner: Mark | null;
  readonly status: GameStatus;
}

export type GameTransition =
  | { readonly accepted: true; readonly state: GameState }
  | {
      readonly accepted: false;
      readonly state: GameState;
      readonly reason: RejectionReason;
    };

export const WINNING_LINES = Object.freeze([
  Object.freeze([0, 1, 2]),
  Object.freeze([3, 4, 5]),
  Object.freeze([6, 7, 8]),
  Object.freeze([0, 3, 6]),
  Object.freeze([1, 4, 7]),
  Object.freeze([2, 5, 8]),
  Object.freeze([0, 4, 8]),
  Object.freeze([2, 4, 6]),
] as const);

const emptyBoard = (): Board =>
  Object.freeze([null, null, null, null, null, null, null, null, null]);

const freezeState = (state: GameState): GameState => {
  Object.freeze(state.board);
  Object.freeze(state.moves);
  return Object.freeze(state);
};

const hasWon = (board: Board, player: Mark): boolean =>
  WINNING_LINES.some((line) => line.every((cell) => board[cell] === player));

export const createGame = (): GameState =>
  freezeState({
    board: emptyBoard(),
    moves: Object.freeze([]),
    currentTurn: 'X',
    winner: null,
    status: 'playing',
  });

export const applyMove = (
  state: GameState,
  player: Mark,
  cell: number,
): GameTransition => {
  if (state.status !== 'playing') {
    return { accepted: false, state, reason: 'game_over' };
  }

  if (!Number.isInteger(cell) || cell < 0 || cell > 8) {
    return { accepted: false, state, reason: 'out_of_range' };
  }

  if (player !== state.currentTurn) {
    return { accepted: false, state, reason: 'wrong_turn' };
  }

  if (state.board[cell] !== null) {
    return { accepted: false, state, reason: 'occupied' };
  }

  const board = [...state.board] as unknown as BoardCell[];
  board[cell] = player;
  const frozenBoard = Object.freeze(board) as unknown as Board;
  const move = Object.freeze({
    ply: state.moves.length + 1,
    player,
    cell,
  });
  const moves = Object.freeze([...state.moves, move]);
  const won = hasWon(frozenBoard, player);
  const draw = !won && frozenBoard.every((value) => value !== null);

  return {
    accepted: true,
    state: freezeState({
      board: frozenBoard,
      moves,
      status: won ? 'won' : draw ? 'draw' : 'playing',
      currentTurn: won || draw ? null : player === 'X' ? 'O' : 'X',
      winner: won ? player : null,
    }),
  };
};

export const chooseCpuMove = (state: GameState): number | null => {
  if (state.status !== 'playing' || state.currentTurn !== 'O') {
    return null;
  }

  const legalCells = state.board
    .map((value, cell) => (value === null ? cell : null))
    .filter((cell): cell is number => cell !== null);

  for (const cell of legalCells) {
    const candidate = [...state.board] as unknown as BoardCell[];
    candidate[cell] = 'O';
    if (hasWon(candidate as unknown as Board, 'O')) {
      return cell;
    }
  }

  return legalCells[0] ?? null;
};

export const quitGame = (state: GameState): GameTransition => {
  if (state.status !== 'playing') {
    return { accepted: false, state, reason: 'game_over' };
  }

  return {
    accepted: true,
    state: freezeState({
      ...state,
      currentTurn: null,
      status: 'quit',
    }),
  };
};

export const rematchGame = (_completedGame?: GameState): GameState => createGame();

export const isLegalMove = (state: GameState, cell: number): boolean =>
  state.status === 'playing' &&
  state.currentTurn === 'X' &&
  Number.isInteger(cell) &&
  cell >= 0 &&
  cell <= 8 &&
  state.board[cell] === null;
