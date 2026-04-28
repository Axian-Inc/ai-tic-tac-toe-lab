export type PlayerMark = "X" | "O";
export type CellValue = PlayerMark | null;
export type GameState =
  | "initializing"
  | "waiting_for_players"
  | "active"
  | "won"
  | "draw"
  | "resigned"
  | "abandoned";
export type GameMode = "player-vs-player" | "player-vs-cpu" | "online-multiplayer";
export type ActorType = "human" | "cpu";

export type MoveRecord = {
  moveNumber: number;
  playerMark: PlayerMark;
  cellIndex: number;
};

export type OnlinePlayerSeat = {
  mark: PlayerMark;
  displayName: string;
  joinedAt: string;
};

export type OnlineGameMetadata = {
  id: string;
  currentTurn: PlayerMark | null;
  latestSequence: number;
  players: Partial<Record<PlayerMark, OnlinePlayerSeat>>;
};

export type Game = {
  board: CellValue[];
  currentPlayer: PlayerMark;
  winner: PlayerMark | null;
  state: GameState;
  moveHistory: MoveRecord[];
  mode: GameMode;
  controllers: Record<PlayerMark, ActorType>;
  online?: OnlineGameMetadata;
};

export type MoveResult = {
  accepted: boolean;
  game: Game;
};

export type GameStatus = {
  heading: string;
  body: string;
};

export const getMatchupLabel = (playerName: string, mode: GameMode): string => {
  if (mode === "player-vs-cpu") {
    return `${playerName} vs CPU`;
  }

  if (mode === "online-multiplayer") {
    return `${playerName} online`;
  }

  return `${playerName} vs ${playerName}`;
};

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

export const CPU_MOVE_PRIORITY: number[] = [4, 0, 2, 6, 8, 1, 3, 5, 7];

export const createEmptyBoard = (): CellValue[] => Array<CellValue>(9).fill(null);

export const getRandomStartingPlayer = (): PlayerMark =>
  Math.random() < 0.5 ? "X" : "O";

const createControllers = (mode: GameMode): Record<PlayerMark, ActorType> => {
  if (mode !== "player-vs-cpu") {
    return { X: "human", O: "human" };
  }

  return Math.random() < 0.5
    ? { X: "human", O: "cpu" }
    : { X: "cpu", O: "human" };
};

export const createNewGame = (mode: GameMode = "player-vs-player"): Game => ({
  board: createEmptyBoard(),
  currentPlayer: getRandomStartingPlayer(),
  winner: null,
  state: "active",
  moveHistory: [],
  mode,
  controllers: createControllers(mode),
});

export const detectWinner = (board: CellValue[]): PlayerMark | null => {
  for (const [a, b, c] of WINNING_LINES) {
    const mark = board[a];
    if (mark !== null && mark === board[b] && mark === board[c]) {
      return mark;
    }
  }

  return null;
};

export const isDraw = (board: CellValue[]): boolean =>
  board.every((cell) => cell !== null) && detectWinner(board) === null;

export const playMove = (
  game: Game,
  actingPlayerMark: PlayerMark,
  cellIndex: number,
): MoveResult => {
  if (game.state !== "active") {
    return { accepted: false, game };
  }

  if (cellIndex < 0 || cellIndex >= game.board.length) {
    return { accepted: false, game };
  }

  if (actingPlayerMark !== game.currentPlayer) {
    return { accepted: false, game };
  }

  if (game.board[cellIndex] !== null) {
    return { accepted: false, game };
  }

  const nextBoard = [...game.board];
  nextBoard[cellIndex] = actingPlayerMark;

  const moveHistory = [
    ...game.moveHistory,
    {
      moveNumber: game.moveHistory.length + 1,
      playerMark: actingPlayerMark,
      cellIndex,
    },
  ];

  const winner = detectWinner(nextBoard);

  if (winner !== null) {
    return {
      accepted: true,
      game: {
        ...game,
        board: nextBoard,
        moveHistory,
        winner,
        state: "won",
      },
    };
  }

  if (isDraw(nextBoard)) {
    return {
      accepted: true,
      game: {
        ...game,
        board: nextBoard,
        moveHistory,
        winner: null,
        state: "draw",
      },
    };
  }

  return {
    accepted: true,
    game: {
      ...game,
      board: nextBoard,
      currentPlayer: actingPlayerMark === "X" ? "O" : "X",
      moveHistory,
      winner: null,
      state: "active",
    },
  };
};

export const abandonGame = (game: Game): Game => {
  if (game.state !== "active") {
    return game;
  }

  return {
    ...game,
    state: "abandoned",
  };
};

export const getLegalMoves = (game: Game): number[] =>
  game.board.flatMap((cell, index) => (cell === null ? index : []));

export const getCurrentController = (game: Game): ActorType =>
  game.controllers[game.currentPlayer];

export const getHumanMark = (game: Game): PlayerMark | null =>
  (Object.entries(game.controllers).find(([, controller]) => controller === "human")?.[0] as
    | PlayerMark
    | undefined) ?? null;

export const hasWinner = (game: Game): boolean => game.winner !== null;

export const chooseCpuMove = (game: Game): number | null => {
  if (game.state !== "active" || getCurrentController(game) !== "cpu") {
    return null;
  }

  const legalMoves = getLegalMoves(game);

  if (legalMoves.length === 0) {
    return null;
  }

  return CPU_MOVE_PRIORITY.find((cellIndex) => legalMoves.includes(cellIndex)) ?? null;
};

export const runCpuTurns = (startingGame: Game): Game => {
  let nextGame = startingGame;

  while (nextGame.state === "active" && getCurrentController(nextGame) === "cpu") {
    const cpuMove = chooseCpuMove(nextGame);

    if (cpuMove === null) {
      return nextGame;
    }

    const result = playMove(nextGame, nextGame.currentPlayer, cpuMove);
    nextGame = result.game;
  }

  return nextGame;
};

export const createGame = (mode: GameMode = "player-vs-player"): Game =>
  runCpuTurns(createNewGame(mode));

export const playTurn = (game: Game, cellIndex: number): Game => {
  const result = playMove(game, game.currentPlayer, cellIndex);
  return result.accepted ? runCpuTurns(result.game) : game;
};

export const getStatus = (game: Game): GameStatus => {
  switch (game.state) {
    case "waiting_for_players":
      return {
        heading: "Waiting for opponent",
        body: "Share the game id with another player to start the online match.",
      };
    case "won":
      if (game.mode === "player-vs-cpu" && game.winner !== null) {
        return {
          heading: game.controllers[game.winner] === "human" ? "You win" : "You lose",
          body:
            game.controllers[game.winner] === "human"
              ? `Your ${game.winner} line ended the match. Start a new game to play again.`
              : `The CPU completed a ${game.winner} line. Start a new game to try again.`,
        };
      }

      return {
        heading: `Winner: ${game.winner}`,
        body: `Player ${game.winner} completed a winning line. Start a new game to play again.`,
      };
    case "draw":
      return {
        heading: "Draw",
        body: "All 9 cells are occupied and no winning line exists.",
      };
    case "resigned":
      return {
        heading: "Player resigned",
        body:
          game.winner === null
            ? "The online game ended by resignation."
            : `Player ${game.winner} wins by resignation.`,
      };
    case "abandoned":
      return {
        heading: "Game abandoned",
        body:
          game.winner === null
            ? "This match was ended explicitly before a win or draw."
            : `Player ${game.winner} wins after the opponent timed out.`,
      };
    case "initializing":
      return {
        heading: "Preparing game",
        body: "Creating a fresh board.",
      };
    case "active":
      if (game.mode === "online-multiplayer") {
        return {
          heading: `Current turn: ${game.online?.currentTurn ?? game.currentPlayer}`,
          body: "The online board updates from the server after each accepted move.",
        };
      }

      return {
        heading: `Current turn: ${game.currentPlayer} (${getCurrentController(game)})`,
        body: `Choose an empty cell to place ${game.currentPlayer}.`,
      };
  }
};

export const getTerminalBanner = (game: Game): string | null => {
  if (game.state === "draw") {
    return "Draw";
  }

  if ((game.state === "resigned" || game.state === "abandoned") && game.winner !== null) {
    return `${game.winner} wins`;
  }

  if (game.state !== "won" || game.winner === null) {
    return null;
  }

  if (game.mode === "player-vs-cpu") {
    return game.controllers[game.winner] === "human" ? "You win" : "You lose";
  }

  return `${game.winner} wins`;
};

export const isCellDisabled = (game: Game, cellIndex: number): boolean =>
  game.state !== "active" || game.board[cellIndex] !== null || getCurrentController(game) === "cpu";

export const getWinningLines = (): number[][] => WINNING_LINES.map((line) => [...line]);
