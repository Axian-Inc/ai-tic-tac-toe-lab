// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../../../../apps/web/src/App';

vi.mock('../../../../apps/web/src/audio', () => ({
  playAudioCue: vi.fn().mockResolvedValue(true),
}));

const startGame = async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Play vs. CPU' }));
  return { board: screen.getByRole('group', { name: 'Tic-Tac-Toe board' }), user };
};

const cell = (board: HTMLElement, oneBasedCell: number, mark = 'empty') =>
  within(board).getByRole('button', { name: `Cell ${oneBasedCell}: ${mark}` });

describe('P1-UI-001: landing and board state', () => {
  it('greets the player and begins a nine-cell X-first CPU game', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Ready for Tic-Tac-Toe?' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Play vs. CPU' }));

    const board = screen.getByRole('group', { name: 'Tic-Tac-Toe board' });
    expect(within(board).getAllByRole('button')).toHaveLength(9);
    expect(screen.getByTestId('game-status')).toHaveTextContent('Your turn — choose an open square.');
  });

  it('marks occupied cells invalid while keeping them focusable and reports an illegal click', async () => {
    const { board, user } = await startGame();
    const first = cell(board, 1);
    await user.click(first);

    const occupied = cell(board, 1, 'X');
    expect(occupied).toHaveAttribute('aria-disabled', 'true');
    expect(occupied).toHaveAttribute('data-valid', 'false');
    occupied.focus();
    expect(occupied).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('That square is unavailable.');
    expect(within(board).getAllByRole('button', { name: /: X$/ })).toHaveLength(1);
  });
});

describe('P1-UI-FEEDBACK-001: terminal and audio feedback', () => {
  it('requests move cues, then celebrates the canonical human win', async () => {
    const { board, user } = await startGame();

    await user.click(cell(board, 1));
    expect(screen.getByTestId('audio-cue')).toHaveTextContent(/move sound requested/i);
    await user.click(cell(board, 4));
    await user.click(cell(board, 7));

    expect(screen.getByTestId('game-status')).toHaveTextContent('You win! Great game.');
    expect(screen.getByTestId('audio-cue')).toHaveTextContent(/win sound requested/i);
    expect(screen.getByTestId('win-confetti')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rematch' })).toBeVisible();
  });

  it('shows written retry feedback and requests the loss cue for the canonical CPU win', async () => {
    const { board, user } = await startGame();

    await user.click(cell(board, 5));
    await user.click(cell(board, 9));
    await user.click(cell(board, 7));

    expect(screen.getByTestId('game-status')).toHaveTextContent('CPU wins. Try again.');
    expect(screen.getByTestId('audio-cue')).toHaveTextContent(/loss sound requested/i);
  });

  it('mutes cues without blocking legal play', async () => {
    const { board, user } = await startGame();

    await user.click(screen.getByRole('button', { name: 'Mute sounds' }));
    await user.click(cell(board, 1));

    expect(cell(board, 1, 'X')).toBeVisible();
    expect(screen.getByTestId('audio-cue')).toHaveTextContent('Sounds muted');
    expect(screen.getByRole('button', { name: 'Unmute sounds' })).toBeVisible();
  });
});

describe('P1-UI-LIFECYCLE-001: quit and rematch', () => {
  it('quits to the landing experience', async () => {
    const { user } = await startGame();
    await user.click(screen.getByRole('button', { name: 'Quit game' }));

    expect(screen.getByRole('button', { name: 'Play vs. CPU' })).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Tic-Tac-Toe board' })).not.toBeInTheDocument();
  });

  it('rematches with an empty board and X to move', async () => {
    const { board, user } = await startGame();
    await user.click(cell(board, 1));
    await user.click(cell(board, 4));
    await user.click(cell(board, 7));
    await user.click(screen.getByRole('button', { name: 'Rematch' }));

    const rematchBoard = screen.getByRole('group', { name: 'Tic-Tac-Toe board' });
    expect(within(rematchBoard).getAllByRole('button', { name: /: empty$/ })).toHaveLength(9);
    expect(screen.getByTestId('game-status')).toHaveTextContent('Your turn — choose an open square.');
  });
});
