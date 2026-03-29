// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePage } from '../../src/routes/GamePage';

const apiMocks = vi.hoisted(() => ({
  getGame: vi.fn(),
  joinGame: vi.fn(),
  submitMove: vi.fn(),
  spectateGame: vi.fn(),
  resignMultiplayerGame: vi.fn(),
  checkAbandonment: vi.fn(),
  createGameUrl: vi.fn((gameId: string) => `http://localhost/game/${gameId}`),
  createMultiplayerWebSocketUrl: vi.fn(() => 'ws://localhost/ws?gameId=g_123'),
  MultiplayerApiError: class MultiplayerApiError extends Error {
    constructor(
      public readonly code: string,
      message: string,
      public readonly statusCode: number,
    ) {
      super(message);
    }
  },
}));

const storageMocks = vi.hoisted(() => ({
  loadParticipantSession: vi.fn(),
  saveParticipantSession: vi.fn(),
}));

vi.mock('../../src/multiplayer/api', () => apiMocks);
vi.mock('../../src/multiplayer/storage', () => storageMocks);

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  public onopen: (() => void) | null = null;
  public onmessage: ((event: MessageEvent<string>) => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: (() => void) | null = null;

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.();
  }

  emitOpen() {
    this.onopen?.();
  }

  emitMessage(data = '{}') {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

function renderGamePage(initialEntry = '/game/g_123') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('GamePage multiplayer flows', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    storageMocks.loadParticipantSession.mockReturnValue({
      playerId: 'p_x_123',
      mark: 'X',
    });
    apiMocks.getGame.mockResolvedValue({
      game: {
        gameId: 'g_123',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: 'Captain Curious',
        status: 'active',
        board: [null, null, null, null, null, null, null, null, null],
        nextMark: 'X',
        moveCount: 0,
        winner: null,
        terminalReason: null,
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        startedAt: '2026-03-21T18:00:30.000Z',
        endedAt: null,
        lastMoveAt: null,
      },
      players: {
        X: { joined: true },
        O: { joined: true },
      },
      events: [],
    });
    apiMocks.submitMove.mockResolvedValue({
      game: {
        gameId: 'g_123',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: 'Captain Curious',
        status: 'active',
        board: ['X', null, null, null, null, null, null, null, null],
        nextMark: 'O',
        moveCount: 1,
        winner: null,
        terminalReason: null,
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T20:00:00.000Z',
        startedAt: '2026-03-21T18:00:30.000Z',
        endedAt: null,
        lastMoveAt: '2026-03-21T20:00:00.000Z',
      },
      event: {
        sequenceNumber: 3,
        eventType: 'move_accepted',
        createdAt: '2026-03-21T20:00:00.000Z',
        payload: {
          mark: 'X',
          position: 0,
          playerId: 'p_x_123',
          status: 'active',
          winner: null,
          terminalReason: null,
        },
      },
    });
  });

  it('submits a multiplayer move for the current player', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-03-21T18:01:31.000Z'));
    renderGamePage();

    await screen.findByText('Your turn. Pick an open square.');
    expect(screen.getByText('Otter Austin')).toBeTruthy();
    expect(screen.getByText('Major Mischief (You)')).toBeTruthy();
    expect(screen.getByText('Captain Curious')).toBeTruthy();
    expect(screen.getByText('Abandon in 1:59')).toBeTruthy();
    MockWebSocket.instances[0]?.emitOpen();

    await userEvent.click(screen.getByRole('button', { name: 'Square 1' }));

    await waitFor(() => {
      expect(apiMocks.submitMove).toHaveBeenCalledWith('g_123', 'p_x_123', 0);
    });
  });

  it('opens a websocket connection for active player sessions', async () => {
    renderGamePage();

    await screen.findByText('Your turn. Pick an open square.');
    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    });

    const socket = MockWebSocket.instances[0];
    await waitFor(() => {
      expect(socket?.onmessage).not.toBeNull();
    });
    expect(socket?.url).toContain('gameId=g_123');
  });

  it('replays an active game on open before returning to live play', async () => {
    vi.useFakeTimers();
    apiMocks.getGame.mockResolvedValue({
      game: {
        gameId: 'g_123',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: 'Captain Curious',
        status: 'active',
        board: ['X', 'O', null, null, null, null, null, null, null],
        nextMark: 'X',
        moveCount: 2,
        winner: null,
        terminalReason: null,
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:40.000Z',
        startedAt: '2026-03-21T18:00:30.000Z',
        endedAt: null,
        lastMoveAt: '2026-03-21T18:00:40.000Z',
      },
      players: {
        X: { joined: true },
        O: { joined: true },
      },
      events: [
        {
          sequenceNumber: 1,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:00:35.000Z',
          payload: {
            mark: 'X',
            position: 0,
            playerId: 'p_x_123',
          },
        },
        {
          sequenceNumber: 2,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:00:40.000Z',
          payload: {
            mark: 'O',
            position: 1,
            playerId: 'p_o_123',
          },
        },
      ],
    });

    renderGamePage();

    await flushAsyncWork();
    await flushAsyncWork();

    expect(screen.getByText('Replay move 1 of 2. X to play.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replaying...' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Square 1' }).textContent).toBe('');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button', { name: 'Square 1' }).textContent).toBe('X');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    await flushAsyncWork();
    expect(screen.getByRole('button', { name: 'Replay' })).toBeTruthy();
    expect(screen.getByText('Your turn. Pick an open square.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Square 1' }).textContent).toBe('X');
    expect(screen.getByRole('button', { name: 'Square 2' }).textContent).toBe('O');
  });

  it('replays a finished game for returning players without losing player identity', async () => {
    vi.useFakeTimers();
    apiMocks.getGame.mockResolvedValue({
      game: {
        gameId: 'g_123',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: 'Captain Curious',
        status: 'over',
        board: ['X', 'O', null, 'O', 'X', null, null, null, 'X'],
        nextMark: null,
        moveCount: 5,
        winner: 'X',
        terminalReason: 'win',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:01:10.000Z',
        startedAt: '2026-03-21T18:00:30.000Z',
        endedAt: '2026-03-21T18:01:10.000Z',
        lastMoveAt: '2026-03-21T18:01:10.000Z',
      },
      players: {
        X: { joined: true },
        O: { joined: true },
      },
      events: [
        {
          sequenceNumber: 1,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:00:35.000Z',
          payload: {
            mark: 'X',
            position: 0,
            playerId: 'p_x_123',
          },
        },
        {
          sequenceNumber: 2,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:00:50.000Z',
          payload: {
            mark: 'O',
            position: 1,
            playerId: 'p_o_123',
          },
        },
        {
          sequenceNumber: 3,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:00:55.000Z',
          payload: {
            mark: 'X',
            position: 4,
            playerId: 'p_x_123',
          },
        },
        {
          sequenceNumber: 4,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:01:00.000Z',
          payload: {
            mark: 'O',
            position: 3,
            playerId: 'p_o_123',
          },
        },
        {
          sequenceNumber: 5,
          eventType: 'move_accepted',
          createdAt: '2026-03-21T18:01:10.000Z',
          payload: {
            mark: 'X',
            position: 8,
            playerId: 'p_x_123',
          },
        },
      ],
    });

    renderGamePage();

    await flushAsyncWork();
    await flushAsyncWork();

    expect(screen.getByText('Replay move 1 of 5. X to play.')).toBeTruthy();
    expect(screen.getByText('Major Mischief (You)')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    await flushAsyncWork();
    expect(screen.getByRole('button', { name: 'Replay' })).toBeTruthy();
    expect(screen.getByText('You win this multiplayer round.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Square 1' }).textContent).toBe('X');
    expect(screen.getByRole('button', { name: 'Square 2' }).textContent).toBe('O');
    expect(screen.getByRole('button', { name: 'Square 4' }).textContent).toBe('O');
    expect(screen.getByRole('button', { name: 'Square 5' }).textContent).toBe('X');
    expect(screen.getByRole('button', { name: 'Square 9' }).textContent).toBe('X');
  });

  it('requires a name before joining from a share link', async () => {
    storageMocks.loadParticipantSession.mockReturnValue(null);
    apiMocks.getGame.mockResolvedValue({
      game: {
        gameId: 'g_123',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: null,
        status: 'waiting',
        board: [null, null, null, null, null, null, null, null, null],
        nextMark: 'X',
        moveCount: 0,
        winner: null,
        terminalReason: null,
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        startedAt: null,
        endedAt: null,
        lastMoveAt: null,
      },
      players: {
        X: { joined: true },
        O: { joined: false },
      },
      events: [],
    });
    apiMocks.joinGame.mockResolvedValue({
      game: {
        gameId: 'g_123',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: 'Captain Curious',
        status: 'active',
        nextMark: 'X',
      },
      participant: {
        role: 'player',
        mark: 'O',
        playerId: 'p_o_123',
      },
      links: {
        gameUrl: 'http://localhost/game/g_123',
      },
    });

    renderGamePage('/game/g_123?join=1');

    await screen.findByDisplayValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Join Game' }));
    expect(apiMocks.joinGame).not.toHaveBeenCalled();
    await screen.findByText('Enter your name before joining this game.');

    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Captain Curious');
    await userEvent.click(screen.getByRole('button', { name: 'Join Game' }));

    await waitFor(() => {
      expect(apiMocks.joinGame).toHaveBeenCalledWith('g_123', 'Captain Curious');
    });
  });
});
