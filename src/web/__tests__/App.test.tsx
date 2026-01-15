import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '../../shared/apiClient';
import type { GameState } from '../../shared/gameState';
import { App } from '../App';

const createState = (overrides?: Partial<GameState>): GameState => ({
  board: Array.from({ length: 9 }, () => null),
  nextPlayer: 'X',
  gameStatus: 'in_progress',
  winner: null,
  opponentId: 'balanced',
  sessionId: 'session-123',
  ...overrides,
});

type StubClient = {
  newGame: ApiClient['newGame'];
  move: ApiClient['move'];
};

const createStubClient = (): StubClient => ({
  newGame: vi.fn(),
  move: vi.fn(),
});

describe('App', () => {
  let client: StubClient;

  beforeEach(() => {
    client = createStubClient();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the initial layout', () => {
    render(<App apiClient={client} />);

    expect(screen.getByText('Play Against AI')).toBeTruthy();
    expect(screen.getByText('Start a new game to play.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start New Game' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Cell/ })).toHaveLength(9);
  });

  it('starts a new game and updates status', async () => {
    const user = userEvent.setup();
    const newGameState = createState({ nextPlayer: 'O' });

    client.newGame = vi.fn().mockResolvedValue({ ok: true, data: newGameState });

    render(<App apiClient={client} />);

    await user.click(screen.getByRole('button', { name: 'Start New Game' }));

    await waitFor(() => {
      expect(screen.getByText('Next player: O')).toBeTruthy();
      expect(screen.getByText('session-123')).toBeTruthy();
    });
  });

  it('plays a move and shows AI rationale', async () => {
    const user = userEvent.setup();
    const initialState = createState();
    const updatedState = createState({
      board: ['X', null, null, null, 'O', null, null, null, null],
      nextPlayer: 'X',
      sessionId: 'session-123',
    });

    client.newGame = vi.fn().mockResolvedValue({ ok: true, data: initialState });
    client.move = vi.fn().mockResolvedValue({
      ok: true,
      data: { state: updatedState, aiRationale: 'Center control.' },
    });

    render(<App apiClient={client} />);

    await user.click(screen.getByRole('button', { name: 'Start New Game' }));
    await user.click(screen.getByRole('button', { name: 'Cell 0' }));

    await waitFor(() => {
      expect(screen.getByText('Center control.')).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: 'Cell 0' }).textContent).toBe('X');
    expect(screen.getByRole('button', { name: 'Cell 4' }).textContent).toBe('O');
  });

  it('renders errors returned by the API', async () => {
    const user = userEvent.setup();

    client.newGame = vi.fn().mockResolvedValue({
      ok: false,
      error: { errorCode: 'INVALID_INPUT', message: 'Bad request.' },
    });

    render(<App apiClient={client} />);

    await user.click(screen.getByRole('button', { name: 'Start New Game' }));

    await waitFor(() => {
      expect(screen.getByText('ERROR INVALID_INPUT:')).toBeTruthy();
      expect(screen.getByText('Bad request.')).toBeTruthy();
    });
  });
});
