import type {
  Mark,
  BoardCell,
  GameSession,
  GameCoreState,
  ValidationOutcome,
  WinResult,
  GameOutcome,
  MarkSelection,
  StartingPlayer,
  MoveRecord,
} from './types';

// Winning line combinations (row, column, diagonal indices)
const WINNING_LINES: [number, number, number][] = [
  [0, 1, 2], // row 1
  [3, 4, 5], // row 2
  [6, 7, 8], // row 3
  [0, 3, 6], // column 1
  [1, 4, 7], // column 2
  [2, 5, 8], // column 3
  [0, 4, 8], // diagonal top-left to bottom-right
  [2, 4, 6], // diagonal top-right to bottom-left
];

/**
 * Initializes a new game board with all empty cells.
 */
export function createEmptyBoard(): BoardCell[] {
  return Array.from<BoardCell>({ length: 9 }).fill(null);
}

/**
 * Creates a new game session with the given player mark selection.
 */
export function createSession(
  selection: MarkSelection,
  options?: { roundNumber?: number; startingPlayer?: StartingPlayer },
): GameSession {
  const playerMark = resolvePlayerMark(selection);
  const cpuMark = getCpuMark(playerMark);
  const startingPlayer = options?.startingPlayer ?? (playerMark === 'X' ? 'player' : 'cpu');

  return {
    playerMark,
    cpuMark,
    selection,
    startingPlayer,
    roundNumber: options?.roundNumber ?? 1,
  };
}

/**
 * Creates the initial game state for a new round.
 */
export function createInitialGameState(session: GameSession): GameCoreState {
  return {
    board: createEmptyBoard(),
    currentTurn: session.startingPlayer === 'cpu' ? session.cpuMark : session.playerMark,
    moveHistory: [],
    phase: 'active',
    winner: null,
  };
}

/**
 * Validates if a move is legal.
 * @returns Validation outcome indicating success or reason for rejection
 */
export function validateMove(
  board: BoardCell[],
  squareIndex: number,
  currentTurn: Mark,
  playerMark: Mark,
): ValidationOutcome {
  // Check if square is occupied
  if (board[squareIndex] !== null) {
    return { success: false, reason: 'occupied' };
  }

  // Check if it's the player's turn
  if (currentTurn !== playerMark) {
    return { success: false, reason: 'not-turn' };
  }

  return { success: true };
}

/**
 * Applies a player's move to the board.
 * @returns Updated board and new current turn
 */
export function makeMove(
  board: BoardCell[],
  squareIndex: number,
  mark: Mark,
  moveHistory: MoveRecord[] = [],
): { newBoard: BoardCell[]; nextTurn: Mark; newMoveHistory: MoveRecord[] } {
  const newBoard = [...board];
  newBoard[squareIndex] = mark;
  const nextTurn = mark === 'X' ? 'O' : 'X';

  return {
    newBoard,
    nextTurn,
    newMoveHistory: [...moveHistory, { squareIndex, mark }],
  };
}

/**
 * Checks if the current board state has a winner.
 * @returns WinResult with winner if found, null otherwise
 */
export function checkWinner(board: BoardCell[]): WinResult {
  for (const [a, b, c] of WINNING_LINES) {
    const markA = board[a];
    const markB = board[b];
    const markC = board[c];

    if (markA !== null && markA === markB && markB === markC) {
      return { winner: markA };
    }
  }

  return { winner: null };
}

/**
 * Checks if the board is full (draw condition).
 */
export function isBoardFull(board: BoardCell[]): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Determines the game outcome after a move.
 * @returns GameOutcome indicating 'active', 'won', or 'draw'
 */
export function determineOutcome(board: BoardCell[]): GameOutcome {
  const winResult = checkWinner(board);
  if (winResult.winner !== null) {
    return { status: 'won', winner: winResult.winner };
  }

  if (isBoardFull(board)) {
    return { status: 'draw' };
  }

  return { status: 'active' };
}

/**
 * Resets the game to initial state (new round).
 */
export function resetGame(session: GameSession): GameCoreState {
  return createInitialGameState(session);
}

/**
 * Returns the deterministic CPU move for the current board.
 */
export function getCpuMove(board: BoardCell[], cpuMark: Mark): number | null {
  if (determineOutcome(board).status !== 'active') {
    return null;
  }

  const winningMove = findWinningMove(board, cpuMark);
  if (winningMove !== null) {
    return winningMove;
  }

  const playerMark = getCpuMark(cpuMark);
  const blockingMove = findWinningMove(board, playerMark);
  if (blockingMove !== null) {
    return blockingMove;
  }

  if (board[4] === null) {
    return 4;
  }

  const oppositeCornerMove = findOppositeCornerMove(board, playerMark);
  if (oppositeCornerMove !== null) {
    return oppositeCornerMove;
  }

  const emptyCornerMove = findFirstEmptySquare(board, [0, 2, 6, 8]);
  if (emptyCornerMove !== null) {
    return emptyCornerMove;
  }

  return findFirstEmptySquare(board, [1, 3, 5, 7]);
}

/**
 * Resolves player mark based on selection (handles Random case).
 */
function resolvePlayerMark(selection: MarkSelection): Mark {
  if (selection === 'Random') {
    return Math.random() < 0.5 ? 'X' : 'O';
  }
  return selection;
}

/**
 * Gets the CPU's mark (opposite of player).
 */
function getCpuMark(playerMark: Mark): Mark {
  return playerMark === 'X' ? 'O' : 'X';
}

function findWinningMove(board: BoardCell[], mark: Mark): number | null {
  for (const squareIndex of getEmptySquares(board)) {
    const candidateBoard = [...board];
    candidateBoard[squareIndex] = mark;

    if (checkWinner(candidateBoard).winner === mark) {
      return squareIndex;
    }
  }

  return null;
}

function findOppositeCornerMove(board: BoardCell[], opponentMark: Mark): number | null {
  const oppositeCorners: Array<[number, number]> = [
    [0, 8],
    [2, 6],
    [6, 2],
    [8, 0],
  ];

  for (const [occupiedCorner, targetCorner] of oppositeCorners) {
    if (board[occupiedCorner] === opponentMark && board[targetCorner] === null) {
      return targetCorner;
    }
  }

  return null;
}

function findFirstEmptySquare(board: BoardCell[], candidates: number[]): number | null {
  for (const squareIndex of candidates) {
    if (board[squareIndex] === null) {
      return squareIndex;
    }
  }

  return null;
}

function getEmptySquares(board: BoardCell[]): number[] {
  const emptySquares: number[] = [];

  board.forEach((cell, squareIndex) => {
    if (cell === null) {
      emptySquares.push(squareIndex);
    }
  });

  return emptySquares;
}

/**
 * Gets the random starting player.
 */
export function getRandomStartingPlayer(): StartingPlayer {
  return Math.random() < 0.5 ? 'player' : 'cpu';
}
