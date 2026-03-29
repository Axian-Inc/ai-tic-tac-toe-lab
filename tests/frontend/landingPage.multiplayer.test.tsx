// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../../src/routes/LandingPage';

const apiMocks = vi.hoisted(() => ({
  createMultiplayerGame: vi.fn(),
  joinGame: vi.fn(),
  listGames: vi.fn(),
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
  saveParticipantSession: vi.fn(),
}));

vi.mock('../../src/multiplayer/api', () => apiMocks);
vi.mock('../../src/multiplayer/gameNames', () => ({
  createSuggestedGameName: vi.fn(() => 'Otter Austin'),
}));
vi.mock('../../src/multiplayer/storage', () => storageMocks);

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

function renderLandingPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <LandingPage />
              <LocationProbe />
            </>
          }
        />
        <Route path="/game/:gameId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function getGameCard(gameName: string) {
  const label = screen.getByText(gameName);
  const card = label.closest('article');

  if (!card) {
    throw new Error(`Unable to find card for ${gameName}`);
  }

  return card;
}

describe('LandingPage multiplayer flows', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.listGames.mockImplementation(async (status: 'waiting' | 'active' | 'over') => {
      if (status === 'waiting') {
        return [
          {
            gameId: 'g_waiting',
            gameName: 'Otter Austin',
            status: 'waiting',
            createdAt: '2026-03-21T18:00:00.000Z',
            updatedAt: '2026-03-21T18:00:00.000Z',
            moveCount: 0,
            winner: null,
            terminalReason: null,
          },
        ];
      }

      if (status === 'active') {
        return [
          {
            gameId: 'g_active',
            gameName: 'Pelican Portland',
            status: 'active',
            createdAt: '2026-03-21T17:00:00.000Z',
            updatedAt: '2026-03-21T18:10:00.000Z',
            moveCount: 3,
            winner: null,
            terminalReason: null,
          },
        ];
      }

      return [
        {
          gameId: 'g_finished',
          gameName: 'Falcon Denver',
          status: 'over',
          createdAt: '2026-03-21T16:00:00.000Z',
          updatedAt: '2026-03-21T18:20:00.000Z',
          moveCount: 5,
          winner: 'X',
          terminalReason: 'win',
        },
      ];
    });
  });

  it('creates a multiplayer game from the create modal state and navigates to it', async () => {
    apiMocks.createMultiplayerGame.mockResolvedValue({
      game: {
        gameId: 'g_created',
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
      participant: {
        role: 'player',
        mark: 'X',
        playerId: 'p_x_123',
      },
      links: {
        gameUrl: 'https://app.example.com/games/g_created',
      },
    });

    renderLandingPage();

    await userEvent.click(
      await screen.findByRole('button', { name: 'New Multiplayer' }),
    );
    expect(screen.getByDisplayValue('Otter Austin')).toBeTruthy();
    expect(screen.queryByLabelText('Multiplayer mode')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Create Game' }));

    await waitFor(() => {
      expect(apiMocks.createMultiplayerGame).toHaveBeenCalledWith('Otter Austin', 'Major Mischief');
      expect(storageMocks.saveParticipantSession).toHaveBeenCalledWith('g_created', {
        playerId: 'p_x_123',
        mark: 'X',
      });
      expect(screen.getByTestId('location-probe').textContent).toBe('/game/g_created');
    });
  });

  it('joins a waiting multiplayer game from the join list only', async () => {
    apiMocks.joinGame.mockResolvedValue({
      game: {
        gameId: 'g_waiting',
        gameName: 'Otter Austin',
        xPlayerName: 'Major Mischief',
        oPlayerName: 'Player O',
        status: 'active',
        nextMark: 'X',
      },
      participant: {
        role: 'player',
        mark: 'O',
        playerId: 'p_o_123',
      },
      links: {
        gameUrl: 'https://app.example.com/games/g_waiting',
      },
    });

    renderLandingPage();

    await userEvent.click(await screen.findByRole('button', { name: 'New Multiplayer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    await screen.findByText('Otter Austin');
    expect(screen.queryByText('Pelican Portland')).toBeNull();
    expect(screen.queryByText('Falcon Denver')).toBeNull();
    await userEvent.click(within(getGameCard('Otter Austin')).getByRole('button', { name: 'Join' }));

    await waitFor(() => {
      expect(apiMocks.joinGame).toHaveBeenCalledWith('g_waiting', 'Major Mischief');
      expect(storageMocks.saveParticipantSession).toHaveBeenCalledWith('g_waiting', {
        playerId: 'p_o_123',
        mark: 'O',
      });
      expect(screen.getByTestId('location-probe').textContent).toBe('/game/g_waiting');
    });
  });

  it('opens an active game in spectator mode from the home spectate flow', async () => {
    renderLandingPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Spectate' }));
    expect(screen.queryByLabelText('Multiplayer mode')).toBeNull();
    expect(screen.queryByLabelText('Your Name')).toBeNull();
    await screen.findByText('Pelican Portland');
    await screen.findByText('Falcon Denver');
    await userEvent.click(within(getGameCard('Pelican Portland')).getByRole('button', { name: 'Spectate' }));

    await waitFor(() => {
      expect(storageMocks.saveParticipantSession).not.toHaveBeenCalled();
      expect(screen.getByTestId('location-probe').textContent).toBe('/game/g_active');
    });
  });

  it('opens a finished game replay from the home spectate flow', async () => {
    renderLandingPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Spectate' }));
    await screen.findByText('Falcon Denver');
    await userEvent.click(within(getGameCard('Falcon Denver')).getByRole('button', { name: 'View Replay' }));

    await waitFor(() => {
      expect(storageMocks.saveParticipantSession).not.toHaveBeenCalled();
      expect(screen.getByTestId('location-probe').textContent).toBe('/game/g_finished');
    });
  });
});
