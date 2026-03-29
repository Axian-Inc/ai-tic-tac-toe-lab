import { describe, expect, it } from 'vitest';
import {
  MultiplayerDomainError,
  checkForAbandonment,
  createMultiplayerGame,
  getAbandonmentTimeoutMs,
  joinMultiplayerGame,
  resignGame,
  submitMove,
} from '../../src/domain/multiplayerGame.js';

function createActiveGame() {
  const created = createMultiplayerGame({
    gameId: 'game-1',
    gameName: 'Otter Austin',
    creatorPlayerId: 'player-x',
    creatorPlayerName: 'Major Mischief',
    createdAt: '2026-03-21T18:00:00.000Z',
  });

  return joinMultiplayerGame(created.game, {
    playerId: 'player-o',
    playerName: 'Captain Curious',
    joinedAt: '2026-03-21T18:00:30.000Z',
  }).game;
}

describe('multiplayerGame domain', () => {
  it('creates a waiting game with X reserved for the creator', () => {
    const created = createMultiplayerGame({
      gameId: 'game-1',
      gameName: 'Otter Austin',
      creatorPlayerId: 'player-x',
      creatorPlayerName: 'Major Mischief',
      createdAt: '2026-03-21T18:00:00.000Z',
    });

    expect(created.game.status).toBe('waiting');
    expect(created.game.gameName).toBe('Otter Austin');
    expect(created.game.xPlayerName).toBe('Major Mischief');
    expect(created.game.xPlayerId).toBe('player-x');
    expect(created.game.oPlayerId).toBeNull();
    expect(created.game.nextMark).toBe('X');
    expect(created.game.lastEventSequenceNumber).toBe(1);
    expect(created.events[0]?.type).toBe('game_created');
    expect(created.events[0]?.sequenceNumber).toBe(1);
  });

  it('joins a waiting game as O and activates it', () => {
    const created = createMultiplayerGame({
      gameId: 'game-1',
      gameName: 'Otter Austin',
      creatorPlayerId: 'player-x',
      creatorPlayerName: 'Major Mischief',
      createdAt: '2026-03-21T18:00:00.000Z',
    });

    const joined = joinMultiplayerGame(created.game, {
      playerId: 'player-o',
      playerName: 'Captain Curious',
      joinedAt: '2026-03-21T18:00:30.000Z',
    });

    expect(joined.game.status).toBe('active');
    expect(joined.game.oPlayerId).toBe('player-o');
    expect(joined.game.oPlayerName).toBe('Captain Curious');
    expect(joined.game.startedAt).toBe('2026-03-21T18:00:30.000Z');
    expect(joined.game.lastEventSequenceNumber).toBe(2);
    expect(joined.events[0]?.type).toBe('player_joined');
    expect(joined.events[0]?.sequenceNumber).toBe(2);
  });

  it('rejects joining a game that is no longer joinable', () => {
    const game = createActiveGame();

    expect(() =>
      joinMultiplayerGame(game, {
        playerId: 'player-z',
        playerName: 'Late Arrival',
        joinedAt: '2026-03-21T18:01:00.000Z',
      }),
    ).toThrowError(MultiplayerDomainError);
  });

  it('accepts legal moves, advances turns, and records move history', () => {
    const game = createActiveGame();
    const moved = submitMove(game, {
      playerId: 'player-x',
      position: 0,
      createdAt: '2026-03-21T18:01:00.000Z',
    });

    expect(moved.game.board[0]).toBe('X');
    expect(moved.game.nextMark).toBe('O');
    expect(moved.game.moveCount).toBe(1);
    expect(moved.game.lastEventSequenceNumber).toBe(3);
    expect(moved.game.moves).toEqual([
      {
        sequenceNumber: 1,
        mark: 'X',
        position: 0,
        createdAt: '2026-03-21T18:01:00.000Z',
        playerId: 'player-x',
      },
    ]);
    expect(moved.events[0]?.type).toBe('move_accepted');
    expect(moved.events[0]?.sequenceNumber).toBe(3);
  });

  it('rejects a move from the wrong player turn', () => {
    const game = createActiveGame();

    expect(() =>
      submitMove(game, {
        playerId: 'player-o',
        position: 0,
        createdAt: '2026-03-21T18:01:00.000Z',
      }),
    ).toThrowError(MultiplayerDomainError);
  });

  it('marks the game over with a win when a player completes a line', () => {
    let game = createActiveGame();

    game = submitMove(game, {
      playerId: 'player-x',
      position: 0,
      createdAt: '2026-03-21T18:01:00.000Z',
    }).game;
    game = submitMove(game, {
      playerId: 'player-o',
      position: 3,
      createdAt: '2026-03-21T18:01:10.000Z',
    }).game;
    game = submitMove(game, {
      playerId: 'player-x',
      position: 1,
      createdAt: '2026-03-21T18:01:20.000Z',
    }).game;
    game = submitMove(game, {
      playerId: 'player-o',
      position: 4,
      createdAt: '2026-03-21T18:01:30.000Z',
    }).game;

    const won = submitMove(game, {
      playerId: 'player-x',
      position: 2,
      createdAt: '2026-03-21T18:01:40.000Z',
    });

    expect(won.game.status).toBe('over');
    expect(won.game.winner).toBe('X');
    expect(won.game.terminalReason).toBe('win');
    expect(won.game.lastEventSequenceNumber).toBe(8);
    expect(won.events.map((event) => event.sequenceNumber)).toEqual([7, 8]);
    expect(won.events.at(-1)?.type).toBe('game_over');
  });

  it('supports resignation and awards the other player the win', () => {
    const game = createActiveGame();
    const resigned = resignGame(game, {
      playerId: 'player-x',
      createdAt: '2026-03-21T18:01:00.000Z',
    });

    expect(resigned.game.status).toBe('over');
    expect(resigned.game.winner).toBe('O');
    expect(resigned.game.terminalReason).toBe('resignation');
    expect(resigned.events.map((event) => event.sequenceNumber)).toEqual([3, 4]);
  });

  it('ends the game by abandonment after the inactivity threshold', () => {
    let game = createActiveGame();

    game = submitMove(game, {
      playerId: 'player-x',
      position: 0,
      createdAt: '2026-03-21T18:01:00.000Z',
    }).game;

    const abandoned = checkForAbandonment(game, {
      playerId: 'player-x',
      checkedAt: new Date(
        Date.parse('2026-03-21T18:01:00.000Z') + getAbandonmentTimeoutMs() + 1,
      ).toISOString(),
    });

    expect(abandoned.abandoned).toBe(true);
    expect(abandoned.game.status).toBe('over');
    expect(abandoned.game.winner).toBe('X');
    expect(abandoned.game.terminalReason).toBe('abandonment');
    expect(abandoned.events.map((event) => event.sequenceNumber)).toEqual([4, 5]);
  });

  it('does not abandon a game before the timeout is reached', () => {
    const game = createActiveGame();

    const result = checkForAbandonment(game, {
      playerId: 'player-o',
      checkedAt: '2026-03-21T18:01:00.000Z',
    });

    expect(result.abandoned).toBe(false);
    expect(result.game).toEqual(game);
    expect(result.events).toEqual([]);
  });
});
