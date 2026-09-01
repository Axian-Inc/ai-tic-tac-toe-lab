import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { MultiplayerApi, MultiplayerApiError } from './multiplayer/api';
import { MultiplayerConnection, type MultiplayerConnectionOptions } from './multiplayer/connection';
import type { GameSnapshot, Mark, PlayerSession } from './multiplayer/types';

const cellName = (cell: number, value: Mark | null): string => `Cell ${cell + 1}: ${value ?? 'empty'}`;

const Confetti = () => (
  <div className="confetti" data-testid="win-confetti" aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => (
      <i key={index} style={{ '--piece': index } as React.CSSProperties} />
    ))}
  </div>
);

function SoundControl({ muted, setMuted }: { muted: boolean; setMuted: (value: boolean) => void }) {
  return (
    <button className="sound-toggle" type="button" aria-pressed={muted} onClick={() => setMuted(!muted)}>
      {muted ? 'Unmute sounds' : 'Mute sounds'}
    </button>
  );
}

function LocalGame({ onExit }: { onExit: (notice?: string) => void }) {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [feedback, setFeedback] = useState('');
  const [muted, setMuted] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [lastCue, setLastCue] = useState<AudioCue | null>(null);

  const requestCue = useCallback((cue: AudioCue) => {
    if (muted) return;
    setLastCue(cue);
    void playAudioCue(cue).then(setAudioAvailable);
  }, [muted]);

  const playCell = (cell: number) => {
    if (!isLegalMove(game, cell)) {
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
    const result = quitGame(game);
    if (result.accepted) onExit('Game quit. Ready for another round?');
  };

  const terminal = game.status !== 'playing';
  const humanWon = game.status === 'won' && game.winner === 'X';
  const status = game.status === 'won'
    ? game.winner === 'X' ? 'You win! Great game.' : 'CPU wins. Try again.'
    : game.status === 'draw' ? "It's a draw."
      : game.currentTurn === 'O' ? 'CPU is thinking…' : 'Your turn — choose an open square.';

  return (
    <main className="app-shell game-detail">
      {humanWon && <Confetti />}
      <section className="card game-card" aria-labelledby="game-title">
        <header className="game-header">
          <div><span className="eyebrow">You are X · CPU is O</span><h1 id="game-title">Tic-Tac-Toe</h1></div>
          <SoundControl muted={muted} setMuted={setMuted} />
        </header>
        <p className="game-status" role="status" data-testid="game-status" aria-live="polite">{status}</p>
        <Board board={game.board} canPlay={(cell) => isLegalMove(game, cell)} onPlay={playCell} />
        <p className="feedback" role={feedback ? 'alert' : 'status'} data-testid="move-feedback">
          {feedback || (terminal ? 'Choose Rematch to play again.' : 'Nine squares. Three in a row wins.')}
        </p>
        <div className="actions">
          {terminal ? (
            <button className="primary-action" type="button" onClick={() => { setGame(rematchGame(game)); setFeedback('New game started. You go first.'); setLastCue(null); }}>Rematch</button>
          ) : (
            <button className="secondary-action" type="button" onClick={leaveGame}>Quit game</button>
          )}
        </div>
        <MoveHistory moves={game.moves} />
        <span className="sr-only" aria-live="polite" data-testid="audio-cue">
          {muted ? 'Sounds muted' : !audioAvailable ? 'Sound unavailable; play continues' : lastCue ? `${lastCue} sound requested` : ''}
        </span>
      </section>
    </main>
  );
}

function Board({ board, canPlay, onPlay }: {
  board: ReadonlyArray<Mark | null>;
  canPlay: (cell: number) => boolean;
  onPlay: (cell: number) => void;
}) {
  return (
    <>
      <p id="board-help" className="board-help">Open squares glow on hover or keyboard focus. Unavailable squares are marked and reject input.</p>
      <div className="board" role="group" aria-label="Tic-Tac-Toe board" aria-describedby="board-help">
        {board.map((value, cell) => {
          const valid = canPlay(cell);
          return (
            <button key={cell} className={`cell ${valid ? 'cell--valid' : 'cell--invalid'}`} type="button"
              data-cell={cell} data-valid={valid} aria-label={cellName(cell, value)} aria-disabled={!valid}
              onClick={() => onPlay(cell)}>
              <span aria-hidden="true">{value}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function MoveHistory({ moves }: { moves: ReadonlyArray<{ ply: number; player: Mark; cell: number }> }) {
  return (
    <details className="move-history">
      <summary>Move history ({moves.length})</summary>
      {moves.length === 0 ? <p>No moves yet.</p> : (
        <ol aria-label="Move history">{moves.map((move) => <li key={move.ply}>Move {move.ply}: {move.player} chose cell {move.cell + 1}</li>)}</ol>
      )}
    </details>
  );
}

const errorMessage = (error: unknown) => error instanceof MultiplayerApiError
  ? error.message
  : error instanceof Error ? error.message : 'The multiplayer service could not be reached.';

function MultiplayerLobby({ api, notice, onSession, onExit }: {
  api: MultiplayerApi;
  notice?: string;
  onSession: (session: PlayerSession, game: GameSnapshot) => void;
  onExit: () => void;
}) {
  const [games, setGames] = useState<GameSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setGames((await api.listWaitingGames()).items); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = async () => {
    setBusy(true); setError('');
    try {
      const result = await api.createGame();
      onSession({ gameId: result.game.id, mark: result.mark, seatToken: result.seatToken }, result.game);
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  };

  const join = async (game: GameSnapshot) => {
    setBusy(true); setError('');
    try {
      const result = await api.joinGame(game);
      onSession({ gameId: result.game.id, mark: result.mark, seatToken: result.seatToken }, result.game);
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); void refresh(); }
  };

  return (
    <main className="app-shell multiplayer-shell">
      <section className="card lobby-card" aria-labelledby="lobby-title">
        <span className="eyebrow">Online multiplayer</span>
        <h1 id="lobby-title">Find a game</h1>
        <p>Create a table as X, or join a waiting player as O.</p>
        {notice && <p role="status">{notice}</p>}
        {error && <p className="error-banner" role="alert">{error}</p>}
        <div className="actions">
          <button className="primary-action" type="button" disabled={busy} onClick={() => void create()}>{busy ? 'Working…' : 'Create new game'}</button>
          <button className="secondary-action" type="button" disabled={loading || busy} onClick={() => void refresh()}>Refresh list</button>
        </div>
        <section aria-labelledby="waiting-title">
          <h2 id="waiting-title">Waiting games</h2>
          {loading ? <p role="status">Loading waiting games…</p> : games.length === 0 ? <p>No games are waiting. Create the first one.</p> : (
            <ul className="game-list">{games.map((game) => (
              <li key={game.id}>
                <span><strong>Game {game.id.slice(0, 8)}</strong><small>Sequence {game.sequence}</small></span>
                <button className="secondary-action" type="button" disabled={busy} onClick={() => void join(game)}>Join game</button>
              </li>
            ))}</ul>
          )}
        </section>
        <button className="text-action" type="button" onClick={onExit}>Back to home</button>
      </section>
    </main>
  );
}

function MultiplayerGame({ api, webSocketUrl, initialGame, session, onExit }: {
  api: MultiplayerApi;
  webSocketUrl: string;
  initialGame: GameSnapshot;
  session: PlayerSession;
  onExit: (notice?: string) => void;
}) {
  const [game, setGame] = useState(initialGame);
  const [connectionStatus, setConnectionStatus] = useState<MultiplayerConnectionOptions['onStatus'] extends (value: infer T) => void ? T : never>('connecting');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const connection = useRef<MultiplayerConnection | null>(null);

  useEffect(() => {
    const active = new MultiplayerConnection({ api, webSocketUrl, gameId: session.gameId, initialSnapshot: initialGame,
      onSnapshot: setGame, onStatus: setConnectionStatus, onError: setFeedback });
    connection.current = active;
    active.start();
    return () => { active.stop(); connection.current = null; };
  }, [api, initialGame, session.gameId, webSocketUrl]);

  const updateFromCommand = (snapshot: GameSnapshot) => {
    setGame(snapshot);
    connection.current?.acceptSnapshot(snapshot);
  };

  const recoverStale = async (cause: unknown) => {
    if (cause instanceof MultiplayerApiError && cause.problem?.code === 'stale_sequence') {
      try { updateFromCommand(await api.getGame(game.id)); } catch { /* Keep the original actionable error. */ }
    }
    setFeedback(errorMessage(cause));
  };

  const play = async (cell: number) => {
    if (busy || game.status !== 'active' || game.currentTurn !== session.mark || game.board[cell] !== null) {
      setFeedback(game.currentTurn === session.mark ? 'That square is unavailable.' : 'Wait for your opponent to move.');
      return;
    }
    setBusy(true); setFeedback('Sending move…');
    try { const result = await api.move(game, cell, session.seatToken); updateFromCommand(result.game); setFeedback('Move accepted.'); }
    catch (cause) { await recoverStale(cause); }
    finally { setBusy(false); }
  };

  const resign = async () => {
    setBusy(true); setFeedback(game.status === 'waiting' ? 'Cancelling game…' : 'Resigning game…');
    try { const result = await api.resign(game, session.seatToken); updateFromCommand(result.game); setFeedback('Game ended.'); }
    catch (cause) { await recoverStale(cause); }
    finally { setBusy(false); }
  };

  const won = game.status === 'over' && game.winner === session.mark;
  const status = game.status === 'waiting' ? 'Waiting for another player to join…'
    : game.status === 'active' ? game.currentTurn === session.mark ? 'Your turn — choose an open square.' : "Opponent's turn — live updates are on."
      : game.endReason === 'draw' ? "It's a draw."
        : game.endReason === 'cancelled' ? 'This waiting game was cancelled.'
          : won ? 'You win! Great game.' : 'Your opponent wins. Try again.';
  const canPlay = (cell: number) => !busy && game.status === 'active' && game.currentTurn === session.mark && game.board[cell] === null;

  return (
    <main className="app-shell game-detail">
      {won && <Confetti />}
      <section className="card game-card" aria-labelledby="multiplayer-title">
        <header className="game-header"><div><span className="eyebrow">You are {session.mark} · online game</span><h1 id="multiplayer-title">Tic-Tac-Toe</h1></div>
          <span className={`connection connection--${connectionStatus}`}>{connectionStatus}</span></header>
        <p className="game-id">Game <code>{game.id}</code></p>
        <p className="game-status" role="status" data-testid="game-status" aria-live="polite">{status}</p>
        <p className="sequence-marker" data-testid="multiplayer-sequence">Applied server sequence: <strong>{game.sequence}</strong></p>
        <Board board={game.board} canPlay={canPlay} onPlay={(cell) => void play(cell)} />
        <p className="feedback" role={feedback && !feedback.endsWith('…') ? 'alert' : 'status'} aria-live="polite">{feedback || 'The server validates every multiplayer move.'}</p>
        <div className="actions">
          {game.status === 'over' ? <button className="primary-action" type="button" onClick={() => onExit('Multiplayer game finished. Create or join another game for a rematch.')}>New multiplayer game</button>
            : <button className="secondary-action danger-action" type="button" disabled={busy} onClick={() => void resign()}>{game.status === 'waiting' ? 'Cancel game' : 'Resign game'}</button>}
        </div>
        <MoveHistory moves={game.moves} />
      </section>
    </main>
  );
}

type View = 'landing' | 'local' | 'lobby' | 'multiplayer';

export function App() {
  const [view, setView] = useState<View>('landing');
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [multiplayerGame, setMultiplayerGame] = useState<GameSnapshot | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const webSocketUrl = import.meta.env.VITE_WS_URL ?? '';
  const api = useMemo(() => new MultiplayerApi(apiBaseUrl), [apiBaseUrl]);

  const leaveTo = (next: View, nextNotice = '') => { setSession(null); setMultiplayerGame(null); setNotice(nextNotice); setView(next); };

  if (view === 'local') return <LocalGame onExit={(message) => leaveTo('landing', message)} />;
  if (view === 'lobby') return <MultiplayerLobby api={api} notice={notice} onExit={() => leaveTo('landing')} onSession={(nextSession, game) => { setSession(nextSession); setMultiplayerGame(game); setNotice(''); setView('multiplayer'); }} />;
  if (view === 'multiplayer' && session && multiplayerGame) return <MultiplayerGame api={api} webSocketUrl={webSocketUrl} initialGame={multiplayerGame} session={session} onExit={(message) => leaveTo('lobby', message)} />;

  const multiplayerConfigured = Boolean(apiBaseUrl && webSocketUrl);
  return (
    <main className="app-shell landing">
      <section className="card hero" aria-labelledby="landing-title">
        <span className="eyebrow">A tiny strategy break</span>
        <h1 id="landing-title">Ready for Tic-Tac-Toe?</h1>
        <p>Play locally against the deterministic CPU, or challenge another player online.</p>
        {notice && <p role="status">{notice}</p>}
        <div className="landing-actions">
          <button className="primary-action" type="button" onClick={() => setView('local')}>Play vs. CPU</button>
          <button className="secondary-action" type="button" disabled={!multiplayerConfigured} onClick={() => setView('lobby')}>Play multiplayer</button>
        </div>
        {!multiplayerConfigured && <p className="config-note" role="note">Multiplayer is unavailable until VITE_API_BASE_URL and VITE_WS_URL are configured.</p>}
      </section>
    </main>
  );
}
