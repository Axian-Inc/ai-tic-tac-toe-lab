export type Player = "X" | "O";
export type Cell = Player | null;
export type GameStatus = "in_progress" | "over" | "quit";

export type Move = {
  player: Player;
  index: number;
  turn: number;
};

export type GameState = {
  board: Cell[];
  moves: Move[];
  currentTurn: Player;
  status: GameStatus;
  winner: Player | null;
};

const BOARD_SIZE = 9;
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

function createEmptyBoard(): Cell[] {
  return Array.from({ length: BOARD_SIZE }, () => null);
}

function createInitialState(): GameState {
  return {
    board: createEmptyBoard(),
    moves: [],
    currentTurn: "X",
    status: "in_progress",
    winner: null,
  };
}

function getWinnerFromBoard(board: Cell[]): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    const cell = board[a];
    if (cell && cell === board[b] && cell === board[c]) {
      return cell;
    }
  }

  return null;
}

export class Game {
  private state: GameState;

  constructor() {
    this.state = createInitialState();
  }

  getState(): GameState {
    return {
      ...this.state,
      board: [...this.state.board],
      moves: this.state.moves.map((move) => ({ ...move })),
    };
  }

  getStatus(): GameStatus {
    return this.state.status;
  }

  getWinner(): Player | null {
    return this.state.winner;
  }

  isLegalMove(index: number): boolean {
    return (
      this.state.status === "in_progress" &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < BOARD_SIZE &&
      this.state.board[index] === null
    );
  }

  /**
   * Attempts to apply a move for the current player.
   * Returns true on success; false when the move is illegal and state is unchanged.
   */
  makeMove(index: number): boolean {
    if (!this.isLegalMove(index)) {
      return false;
    }

    const { currentTurn, board, moves } = this.state;
    const nextBoard = [...board];
    nextBoard[index] = currentTurn;

    const move: Move = {
      player: currentTurn,
      index,
      turn: moves.length + 1,
    };

    const winner = getWinnerFromBoard(nextBoard);
    const isBoardFull = moves.length + 1 >= BOARD_SIZE;

    this.state = {
      board: nextBoard,
      moves: [...moves, move],
      currentTurn: currentTurn === "X" ? "O" : "X",
      status: winner || isBoardFull ? "over" : "in_progress",
      winner,
    };

    return true;
  }

  reset(): void {
    this.state = createInitialState();
  }

  quit(): void {
    this.state = {
      ...this.state,
      status: "quit",
      winner: null,
    };
  }
}

export function newGame(): Game {
  return new Game();
}
