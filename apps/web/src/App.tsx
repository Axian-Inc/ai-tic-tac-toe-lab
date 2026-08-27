import { useCallback, useState } from 'react';
import {
  applyMove,
  chooseCpuMove,
  createGame,
  isLegalMove,
  quitGame,
  rematchGame,
  type GameState,
} from '@tic-tac-toe/game-core';
import { playAudioCue, type AudioCue } from './audio';

const cellName = (cell: number, value: 'X' | 'O' | null): string =>
  `Cell ${cell + 1}: ${value ?? 'empty'}`;

const statusText = (game: GameState): string => {
  if (game.status === 'won' && game.winner === 'X') return 'You win! Great game.';
  if (game.status === 'won' && game.winner === 'O') return 'CPU wins. Try again.';
  if (game.status === 'draw') return "It's a draw.";
  if (game.currentTurn === 'O') return 'CPU is thinking…';
  return 'Your turn — choose an open square.';
};

const Confetti = () => (
  <div className="confetti" data-testid="win-confetti" aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => (
      <i key={index} style={{ '--piece': index } as React.CSSProperties} />
    ))}
  </div>
);

export function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [feedback, setFeedback] = useState('');
  const [landingNotice, setLandingNotice] = useState('');
  const [muted, setMuted] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [lastCue, setLastCue] = useState<AudioCue | null>(null);

  const requestCue = useCallback(
    (cue: AudioCue) => {
      if (muted) return;
      setLastCue(cue);
      void playAudioCue(cue).then(setAudioAvailable);
    },
    [muted],
  );

  const startGame = () => {
    setGame(createGame());
    setFeedback('');
    setLandingNotice('');
    setLastCue(null);
  };

  const playCell = (cell: number) => {
    if (!game || !isLegalMove(game, cell)) {
      setFeedback('That square is unavailable. Choose an open square.');
      return;
    }

    const human = applyMove(game, 'X', cell);
    if (!human.accepted) {
      setFeedback(`Move rejected: ${human.reason}.`);
      return;
    }

    requestCue('move');
    setFeedback('');
    let next = human.state;

    if (next.status === 'won') {
      requestCue('win');
      setGame(next);
      return;
    }
    if (next.status === 'draw') {
      setGame(next);
      return;
    }

    const cpuCell = chooseCpuMove(next);
    if (cpuCell !== null) {
      const cpu = applyMove(next, 'O', cpuCell);
      if (cpu.accepted) {
        requestCue('move');
        next = cpu.state;
        if (next.status === 'won') requestCue('loss');
      }
    }

    setGame(next);
  };

  const leaveGame = () => {
    if (!game) return;
    const result = quitGame(game);
    if (result.accepted) {
      setGame(null);
      setLandingNotice('Game quit. Ready for another round?');
      setFeedback('');
      setLastCue(null);
    }
  };

  const rematch = () => {
    if (!game) return;
    setGame(rematchGame(game));
    setFeedback('New game started. You go first.');
    setLastCue(null);
  };

  const soundControl = (
    <button
      className="sound-toggle"
      type="button"
      aria-pressed={muted}
      onClick={() => setMuted((value) => !value)}
    >
      {muted ? 'Unmute sounds' : 'Mute sounds'}
    </button>
  );

  if (!game) {
    return (
      <main className="app-shell landing">
        <section className="card hero" aria-labelledby="landing-title">
          <span className="eyebrow">A tiny strategy break</span>
          <h1 id="landing-title">Ready for Tic-Tac-Toe?</h1>
          <p>Play a quick local game against our predictable—but opportunistic—CPU.</p>
          {landingNotice && <p role="status">{landingNotice}</p>}
          <button className="primary-action" type="button" onClick={startGame}>
            Play vs. CPU
          </button>
          {soundControl}
        </section>
      </main>
    );
  }

  const terminal = game.status !== 'playing';
  const humanWon = game.status === 'won' && game.winner === 'X';

  return (
    <main className="app-shell game-detail">
      {humanWon && <Confetti />}
      <section className="card game-card" aria-labelledby="game-title">
        <header className="game-header">
          <div>
            <span className="eyebrow">You are X · CPU is O</span>
            <h1 id="game-title">Tic-Tac-Toe</h1>
          </div>
          {soundControl}
        </header>

        <p className="game-status" role="status" data-testid="game-status" aria-live="polite">
          {statusText(game)}
        </p>

        <p id="board-help" className="board-help">
          Open squares glow on hover or keyboard focus. Unavailable squares are marked and reject input.
        </p>

        <div className="board" role="group" aria-label="Tic-Tac-Toe board" aria-describedby="board-help">
          {game.board.map((value, cell) => {
            const valid = isLegalMove(game, cell);
            return (
              <button
                key={cell}
                className={`cell ${valid ? 'cell--valid' : 'cell--invalid'}`}
                type="button"
                data-cell={cell}
                data-valid={valid}
                aria-label={cellName(cell, value)}
                aria-disabled={!valid}
                onClick={() => playCell(cell)}
              >
                <span aria-hidden="true">{value}</span>
              </button>
            );
          })}
        </div>

        <p className="feedback" role={feedback ? 'alert' : 'status'} data-testid="move-feedback">
          {feedback || (terminal ? 'Choose Rematch to play again.' : 'Nine squares. Three in a row wins.')}
        </p>

        <div className="actions">
          {terminal ? (
            <button className="primary-action" type="button" onClick={rematch}>
              Rematch
            </button>
          ) : (
            <button className="secondary-action" type="button" onClick={leaveGame}>
              Quit game
            </button>
          )}
        </div>

        <details className="move-history">
          <summary>Move history ({game.moves.length})</summary>
          {game.moves.length === 0 ? (
            <p>No moves yet.</p>
          ) : (
            <ol aria-label="Move history">
              {game.moves.map((move) => (
                <li key={move.ply}>
                  Move {move.ply}: {move.player} chose cell {move.cell + 1}
                </li>
              ))}
            </ol>
          )}
        </details>

        <span className="sr-only" aria-live="polite" data-testid="audio-cue">
          {muted ? 'Sounds muted' : !audioAvailable ? 'Sound unavailable; play continues' : lastCue ? `${lastCue} sound requested` : ''}
        </span>
      </section>
    </main>
  );
}

