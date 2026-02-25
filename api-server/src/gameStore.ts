import crypto from 'node:crypto';

const BOARD_SIZE = 9;
const winningLines: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type Player = 'X' | 'O';
export type Cell = Player | null;
export type GameStatus = 'waiting' | 'active' | 'over';
export type CompletedReason = 'player_left' | null;

export type PublicGameState = {
  id: string;
  board: Cell[];
  nextTurn: Player;
  winner: Player | null;
  isDraw: boolean;
  status: GameStatus;
  completedReason: CompletedReason;
  players: {
    X: boolean;
    O: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

type InternalGame = {
  id: string;
  board: Cell[];
  nextTurn: Player;
  players: {
    X: string | null;
    O: string | null;
  };
  moveCount: number;
  forcedWinner: Player | null;
  completedReason: CompletedReason;
  createdAt: string;
  updatedAt: string;
};

export type PlayerAssignment = {
  game: PublicGameState;
  assignedSymbol: Player;
  playerId: string;
};

function calculateWinner(board: ReadonlyArray<Cell>): Player | null {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function deriveGameState(game: InternalGame): {
  winner: Player | null;
  isDraw: boolean;
  status: GameStatus;
} {
  const winner = game.forcedWinner || calculateWinner(game.board);
  const isDraw = !winner && !game.completedReason && game.board.every((cell) => cell !== null);
  const status: GameStatus = winner || isDraw || game.completedReason
    ? 'over'
    : game.players.X && game.players.O
      ? 'active'
      : 'waiting';

  return { winner, isDraw, status };
}

function buildPublicState(game: InternalGame): PublicGameState {
  const { winner, isDraw, status } = deriveGameState(game);

  return {
    id: game.id,
    board: [...game.board],
    nextTurn: game.nextTurn,
    winner,
    isDraw,
    status,
    completedReason: game.completedReason,
    players: {
      X: Boolean(game.players.X),
      O: Boolean(game.players.O),
    },
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

export class GameStore {
  private readonly games = new Map<string, InternalGame>();

  createGame(): PlayerAssignment {
    const gameId = crypto.randomUUID();
    const playerId = crypto.randomUUID();
    const now = new Date().toISOString();

    const game: InternalGame = {
      id: gameId,
      board: Array<Cell>(BOARD_SIZE).fill(null),
      nextTurn: 'X',
      players: {
        X: playerId,
        O: null,
      },
      moveCount: 0,
      forcedWinner: null,
      completedReason: null,
      createdAt: now,
      updatedAt: now,
    };

    this.games.set(gameId, game);

    return {
      game: buildPublicState(game),
      assignedSymbol: 'X',
      playerId,
    };
  }

  joinGame(gameId: string): PlayerAssignment {
    const game = this.games.get(gameId);

    if (!game) {
      throw new Error('GAME_NOT_FOUND');
    }

    if (deriveGameState(game).status === 'over') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    if (game.players.X && game.players.O) {
      throw new Error('GAME_FULL');
    }

    const assignedSymbol: Player = game.players.X ? 'O' : 'X';
    const playerId = crypto.randomUUID();
    game.players[assignedSymbol] = playerId;
    if (assignedSymbol === 'X') {
      game.nextTurn = 'X';
    }

    game.forcedWinner = null;
    game.completedReason = null;
    game.updatedAt = new Date().toISOString();

    return {
      game: buildPublicState(game),
      assignedSymbol,
      playerId,
    };
  }

  getGame(gameId: string): PublicGameState {
    const game = this.games.get(gameId);

    if (!game) {
      throw new Error('GAME_NOT_FOUND');
    }

    return buildPublicState(game);
  }

  makeMove(gameId: string, playerId: string, position: number): PublicGameState {
    const game = this.games.get(gameId);

    if (!game) {
      throw new Error('GAME_NOT_FOUND');
    }

    if (!Number.isInteger(position) || position < 0 || position >= BOARD_SIZE) {
      throw new Error('INVALID_POSITION');
    }

    const symbol: Player | null = game.players.X === playerId ? 'X' : game.players.O === playerId ? 'O' : null;

    if (!symbol) {
      throw new Error('PLAYER_NOT_IN_GAME');
    }

    if (!game.players.X || !game.players.O) {
      throw new Error('GAME_NOT_READY');
    }

    if (deriveGameState(game).status === 'over') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    if (game.nextTurn !== symbol) {
      throw new Error('NOT_YOUR_TURN');
    }

    if (game.board[position]) {
      throw new Error('CELL_ALREADY_TAKEN');
    }

    game.board[position] = symbol;
    game.moveCount += 1;
    game.nextTurn = symbol === 'X' ? 'O' : 'X';
    game.updatedAt = new Date().toISOString();

    return buildPublicState(game);
  }

  leaveGame(gameId: string, playerId: string): PublicGameState {
    const game = this.games.get(gameId);

    if (!game) {
      throw new Error('GAME_NOT_FOUND');
    }

    const symbol: Player | null = game.players.X === playerId ? 'X' : game.players.O === playerId ? 'O' : null;

    if (!symbol) {
      throw new Error('PLAYER_NOT_IN_GAME');
    }

    game.players[symbol] = null;

    if (game.moveCount === 0 && !game.completedReason) {
      game.nextTurn = 'X';
      game.updatedAt = new Date().toISOString();
      return buildPublicState(game);
    }

    if (!game.completedReason) {
      const remainingSymbol: Player = symbol === 'X' ? 'O' : 'X';
      game.forcedWinner = game.players[remainingSymbol] ? remainingSymbol : null;
      game.completedReason = 'player_left';
    }

    game.updatedAt = new Date().toISOString();
    return buildPublicState(game);
  }
}
