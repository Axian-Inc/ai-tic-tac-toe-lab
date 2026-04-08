export type Player = "X" | "O";
export type BoardCell = Player | null;
export type Board = BoardCell[];

export interface Move {
  order: number;
  player: Player;
  position: number;
}

export interface GameStatus {
  winner: Player | null;
  isDraw: boolean;
  isOver: boolean;
}

export interface GameState {
  board: Board;
  moves: Move[];
  currentPlayer: Player;
  status: GameStatus;
}

const BOARD_SIZE = 9;
const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function createInitialBoard(): Board {
  return Array.from<BoardCell>({ length: BOARD_SIZE }).fill(null);
}

function getNextPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position >= 0 && position < BOARD_SIZE;
}

function hasWinningLine(board: Board, player: Player): boolean {
  return WINNING_LINES.some(
    ([a, b, c]) => board[a] === player && board[b] === player && board[c] === player
  );
}

function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

function cloneState(state: GameState): GameState {
  return {
    board: [...state.board],
    moves: state.moves.map((move) => ({ ...move })),
    currentPlayer: state.currentPlayer,
    status: { ...state.status },
  };
}

function isPlayer(value: unknown): value is Player {
  return value === "X" || value === "O";
}

function isBoardCell(value: unknown): value is BoardCell {
  return value === null || isPlayer(value);
}

function areStatusesEqual(left: GameStatus, right: GameStatus): boolean {
  return (
    left.winner === right.winner &&
    left.isDraw === right.isDraw &&
    left.isOver === right.isOver
  );
}

export function validateGameState(state: unknown): GameState | null {
  const candidate = state as Partial<GameState> | null;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  if (
    !Array.isArray(candidate.board) ||
    candidate.board.length !== BOARD_SIZE ||
    !candidate.board.every((cell) => isBoardCell(cell))
  ) {
    return null;
  }

  if (!Array.isArray(candidate.moves) || candidate.moves.length > BOARD_SIZE) {
    return null;
  }

  const moves = candidate.moves;
  if (
    !moves.every(
      (move, index) =>
        move &&
        typeof move === "object" &&
        move.order === index + 1 &&
        isPlayer(move.player) &&
        isValidPosition(move.position)
    )
  ) {
    return null;
  }

  if (!isPlayer(candidate.currentPlayer)) {
    return null;
  }

  const status = candidate.status;
  if (
    !status ||
    typeof status !== "object" ||
    !isBoardCell(status.winner) ||
    typeof status.isDraw !== "boolean" ||
    typeof status.isOver !== "boolean"
  ) {
    return null;
  }

  const reconstructedGame = new Game();
  for (const move of moves) {
    if (!reconstructedGame.placeMove(move.position)) {
      return null;
    }
  }

  const reconstructedState = reconstructedGame.getState();
  const boardMatches = reconstructedState.board.every(
    (cell, index) => cell === candidate.board?.[index]
  );
  const movesMatch = reconstructedState.moves.every(
    (move, index) =>
      move.order === moves[index]?.order &&
      move.player === moves[index]?.player &&
      move.position === moves[index]?.position
  );

  if (
    !boardMatches ||
    !movesMatch ||
    reconstructedState.currentPlayer !== candidate.currentPlayer ||
    !areStatusesEqual(reconstructedState.status, status)
  ) {
    return null;
  }

  return cloneState(reconstructedState);
}

export class Game {
  private state: GameState;

  constructor(initialState?: GameState) {
    this.state = initialState
      ? cloneState(initialState)
      : {
          board: createInitialBoard(),
          moves: [],
          currentPlayer: "X",
          status: {
            winner: null,
            isDraw: false,
            isOver: false,
          },
        };
  }

  getState(): GameState {
    return cloneState(this.state);
  }

  getBoard(): Board {
    return [...this.state.board];
  }

  getMoves(): Move[] {
    return this.state.moves.map((move) => ({ ...move }));
  }

  getCurrentPlayer(): Player {
    return this.state.currentPlayer;
  }

  getStatus(): GameStatus {
    return { ...this.state.status };
  }

  canPlaceMove(position: number): boolean {
    return (
      isValidPosition(position) &&
      !this.state.status.isOver &&
      this.state.board[position] === null
    );
  }

  placeMove(position: number): boolean {
    if (!this.canPlaceMove(position)) {
      return false;
    }

    const player = this.state.currentPlayer;

    this.state.board[position] = player;
    this.state.moves.push({
      order: this.state.moves.length + 1,
      player,
      position,
    });

    if (hasWinningLine(this.state.board, player)) {
      this.state.status = {
        winner: player,
        isDraw: false,
        isOver: true,
      };
      return true;
    }

    if (isBoardFull(this.state.board)) {
      this.state.status = {
        winner: null,
        isDraw: true,
        isOver: true,
      };
      return true;
    }

    this.state.currentPlayer = getNextPlayer(player);

    return true;
  }
}
