import {
  calculateLegalMoves,
  calculateWinner,
  createEmptyBoard,
  getNextPlayer,
  isValidPosition,
} from '../../../shared/ticTacToe.js';
import type { Board, Player } from '../../../shared/ticTacToe.js';
import type {
  AbandonmentCheckResult,
  DomainResult,
  MultiplayerEvent,
  MultiplayerGame,
  MultiplayerMove,
  TerminalReason,
} from './types.js';

const ABANDONMENT_TIMEOUT_MS = 3 * 60 * 1000;

export class MultiplayerDomainError extends Error {
  constructor(
    public readonly code:
      | 'game_not_joinable'
      | 'player_not_allowed'
      | 'game_not_active'
      | 'invalid_move'
      | 'not_your_turn'
      | 'already_over',
    message: string,
  ) {
    super(message);
    this.name = 'MultiplayerDomainError';
  }
}

interface CreateGameInput {
  gameId: string;
  gameName: string;
  creatorPlayerId: string;
  creatorPlayerName: string;
  createdAt: string;
}

interface JoinGameInput {
  playerId: string;
  playerName: string;
  joinedAt: string;
}

interface MoveInput {
  playerId: string;
  position: number;
  createdAt: string;
}

interface ResignInput {
  playerId: string;
  createdAt: string;
}

interface AbandonmentInput {
  playerId: string;
  checkedAt: string;
  timeoutMs?: number;
}

interface AutomaticAbandonmentInput {
  checkedAt: string;
  timeoutMs?: number;
}

function cloneGame(game: MultiplayerGame): MultiplayerGame {
  return {
    ...game,
    board: [...game.board] as Board,
    moves: game.moves.map((move: MultiplayerMove) => ({ ...move })),
  };
}

function getPlayerMark(game: MultiplayerGame, playerId: string): Player | null {
  if (playerId === game.xPlayerId) {
    return 'X';
  }

  if (playerId === game.oPlayerId) {
    return 'O';
  }

  return null;
}

function getPlayerIdForMark(game: MultiplayerGame, mark: Player): string | null {
  return mark === 'X' ? game.xPlayerId : game.oPlayerId;
}

function createEvent<TPayload>(
  sequenceNumber: number,
  type: MultiplayerEvent['type'],
  createdAt: string,
  payload: TPayload,
): MultiplayerEvent<TPayload> {
  return {
    sequenceNumber,
    type,
    createdAt,
    payload,
  };
}

function nextSequenceNumber(game: MultiplayerGame): number {
  return game.lastEventSequenceNumber + 1;
}

function assertActive(game: MultiplayerGame): void {
  if (game.status === 'over') {
    throw new MultiplayerDomainError('already_over', 'The game is already over.');
  }

  if (game.status !== 'active') {
    throw new MultiplayerDomainError('game_not_active', 'The game is not active.');
  }
}

function resolveTerminalState(
  board: MultiplayerGame['board'],
): Pick<MultiplayerGame, 'status' | 'winner' | 'terminalReason' | 'nextMark'> {
  const winner = calculateWinner(board);

  if (winner) {
    return {
      status: 'over',
      winner,
      terminalReason: 'win',
      nextMark: null,
    };
  }

  if (calculateLegalMoves(board).length === 0) {
    return {
      status: 'over',
      winner: null,
      terminalReason: 'draw',
      nextMark: null,
    };
  }

  const moveCount = board.filter((cell: Board[number]) => cell !== null).length;

  return {
    status: 'active',
    winner: null,
    terminalReason: null,
    nextMark: moveCount % 2 === 0 ? 'X' : 'O',
  };
}

export function createMultiplayerGame(input: CreateGameInput): DomainResult {
  const game: MultiplayerGame = {
    gameId: input.gameId,
    gameName: input.gameName,
    xPlayerName: input.creatorPlayerName,
    oPlayerName: null,
    status: 'waiting',
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    startedAt: null,
    endedAt: null,
    lastMoveAt: null,
    xPlayerId: input.creatorPlayerId,
    oPlayerId: null,
    board: createEmptyBoard(),
    nextMark: 'X',
    winner: null,
    terminalReason: null,
    moveCount: 0,
    lastEventSequenceNumber: 1,
    moves: [],
  };

  return {
    game,
    events: [
      createEvent(1, 'game_created', input.createdAt, {
        gameId: game.gameId,
        gameName: game.gameName,
        xPlayerName: game.xPlayerName,
      }),
    ],
  };
}

export function joinMultiplayerGame(game: MultiplayerGame, input: JoinGameInput): DomainResult {
  if (game.status !== 'waiting' || game.oPlayerId !== null || input.playerId === game.xPlayerId) {
    throw new MultiplayerDomainError('game_not_joinable', 'The game cannot be joined.');
  }

  const nextGame = cloneGame(game);
  nextGame.status = 'active';
  nextGame.oPlayerId = input.playerId;
  nextGame.oPlayerName = input.playerName;
  nextGame.startedAt = input.joinedAt;
  nextGame.updatedAt = input.joinedAt;
  nextGame.lastEventSequenceNumber = nextSequenceNumber(game);

  return {
    game: nextGame,
    events: [
      createEvent(nextGame.lastEventSequenceNumber, 'player_joined', input.joinedAt, {
        mark: 'O',
        playerName: nextGame.oPlayerName,
      }),
    ],
  };
}

export function submitMove(game: MultiplayerGame, input: MoveInput): DomainResult {
  assertActive(game);

  const mark = getPlayerMark(game, input.playerId);

  if (mark === null) {
    throw new MultiplayerDomainError('player_not_allowed', 'The player is not part of this game.');
  }

  if (game.nextMark !== mark) {
    throw new MultiplayerDomainError('not_your_turn', 'It is not this player’s turn.');
  }

  if (!isValidPosition(input.position) || game.board[input.position] !== null) {
    throw new MultiplayerDomainError('invalid_move', 'The requested move is invalid.');
  }

  const nextGame = cloneGame(game);
  nextGame.board[input.position] = mark;

  const move: MultiplayerMove = {
    sequenceNumber: nextGame.moves.length + 1,
    mark,
    position: input.position,
    createdAt: input.createdAt,
    playerId: input.playerId,
  };

  nextGame.moves.push(move);
  nextGame.moveCount = nextGame.moves.length;
  nextGame.updatedAt = input.createdAt;
  nextGame.lastMoveAt = input.createdAt;

  const terminal = resolveTerminalState(nextGame.board);
  nextGame.status = terminal.status;
  nextGame.winner = terminal.winner;
  nextGame.terminalReason = terminal.terminalReason;
  nextGame.nextMark =
    terminal.status === 'active' ? getNextPlayer(mark) : terminal.nextMark;
  nextGame.endedAt = terminal.status === 'over' ? input.createdAt : null;
  nextGame.lastEventSequenceNumber = game.lastEventSequenceNumber + (nextGame.status === 'over' ? 2 : 1);

  const events: MultiplayerEvent[] = [
    createEvent(game.lastEventSequenceNumber + 1, 'move_accepted', input.createdAt, {
      mark,
      position: input.position,
      playerId: input.playerId,
      status: nextGame.status,
      winner: nextGame.winner,
      terminalReason: nextGame.terminalReason,
    }),
  ];

  if (nextGame.status === 'over') {
    events.push(
      createEvent(game.lastEventSequenceNumber + 2, 'game_over', input.createdAt, {
        winner: nextGame.winner,
        terminalReason: nextGame.terminalReason,
      }),
    );
  }

  return {
    game: nextGame,
    events,
  };
}

export function resignGame(game: MultiplayerGame, input: ResignInput): DomainResult {
  assertActive(game);

  const mark = getPlayerMark(game, input.playerId);

  if (mark === null) {
    throw new MultiplayerDomainError('player_not_allowed', 'The player is not part of this game.');
  }

  const nextGame = cloneGame(game);
  nextGame.status = 'over';
  nextGame.winner = getNextPlayer(mark);
  nextGame.terminalReason = 'resignation';
  nextGame.nextMark = null;
  nextGame.updatedAt = input.createdAt;
  nextGame.endedAt = input.createdAt;
  nextGame.lastEventSequenceNumber = game.lastEventSequenceNumber + 2;

  return {
    game: nextGame,
    events: [
      createEvent(game.lastEventSequenceNumber + 1, 'game_resigned', input.createdAt, {
        resignedMark: mark,
        winner: nextGame.winner,
      }),
      createEvent(game.lastEventSequenceNumber + 2, 'game_over', input.createdAt, {
        winner: nextGame.winner,
        terminalReason: nextGame.terminalReason,
      }),
    ],
  };
}

export function checkForAbandonment(
  game: MultiplayerGame,
  input: AbandonmentInput,
): AbandonmentCheckResult {
  assertActive(game);

  const mark = getPlayerMark(game, input.playerId);

  if (mark === null) {
    throw new MultiplayerDomainError('player_not_allowed', 'The player is not part of this game.');
  }

  return resolveAbandonmentIfTimedOut(game, {
    checkedAt: input.checkedAt,
    timeoutMs: input.timeoutMs,
  });
}

export function resolveAutomaticAbandonment(
  game: MultiplayerGame,
  input: AutomaticAbandonmentInput,
): AbandonmentCheckResult {
  if (game.status !== 'active') {
    return { game, events: [], abandoned: false };
  }

  return resolveAbandonmentIfTimedOut(game, input);
}

export function getAbandonmentTimeoutMs(): number {
  return ABANDONMENT_TIMEOUT_MS;
}

export function getTerminalReason(game: MultiplayerGame): TerminalReason {
  return game.terminalReason;
}

function resolveAbandonmentIfTimedOut(
  game: MultiplayerGame,
  input: AutomaticAbandonmentInput,
): AbandonmentCheckResult {
  const inactivityStartedAt = game.lastMoveAt ?? game.startedAt;

  if (inactivityStartedAt === null || game.nextMark === null) {
    return { game, events: [], abandoned: false };
  }

  const timeoutMs = input.timeoutMs ?? ABANDONMENT_TIMEOUT_MS;
  const elapsedMs =
    Date.parse(input.checkedAt) - Date.parse(inactivityStartedAt);

  if (elapsedMs < timeoutMs) {
    return { game, events: [], abandoned: false };
  }

  const idleMark = game.nextMark;
  const winner = getNextPlayer(idleMark);
  const winnerPlayerId = getPlayerIdForMark(game, winner);

  if (winnerPlayerId === null) {
    throw new MultiplayerDomainError('game_not_active', 'Cannot resolve abandonment winner.');
  }

  const nextGame = cloneGame(game);
  nextGame.status = 'over';
  nextGame.winner = winner;
  nextGame.terminalReason = 'abandonment';
  nextGame.nextMark = null;
  nextGame.updatedAt = input.checkedAt;
  nextGame.endedAt = input.checkedAt;
  nextGame.lastEventSequenceNumber = game.lastEventSequenceNumber + 2;

  return {
    game: nextGame,
    abandoned: true,
    events: [
      createEvent(game.lastEventSequenceNumber + 1, 'abandonment_checked', input.checkedAt, {
        idleMark,
        winner,
      }),
      createEvent(game.lastEventSequenceNumber + 2, 'game_over', input.checkedAt, {
        winner: nextGame.winner,
        terminalReason: nextGame.terminalReason,
      }),
    ],
  };
}
