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

function createInitialBoard(): Board {
  return Array.from<BoardCell>({ length: BOARD_SIZE }).fill(null);
}

function getNextPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position >= 0 && position < BOARD_SIZE;
}

function cloneState(state: GameState): GameState {
  return {
    board: [...state.board],
    moves: state.moves.map((move) => ({ ...move })),
    currentPlayer: state.currentPlayer,
    status: { ...state.status },
  };
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
    this.state.currentPlayer = getNextPlayer(player);

    return true;
  }
}
