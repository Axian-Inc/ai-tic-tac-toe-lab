import { useEffect, useMemo, useRef, useState } from 'react';
import type { MultiplayerGameState } from '../../shared/contracts';
import { BoardPreview } from '../features/game/components/BoardPreview';
import type { GameState } from '../features/game/model';

interface MultiplayerGamePageProps {
  readonly game: MultiplayerGameState;
  readonly renderableGameState: GameState;
  readonly localPlayer: 'X' | 'O' | null;
  readonly connectionState: 'connecting' | 'connected' | 'disconnected';
  readonly feedbackMessage: string | null;
  readonly requestError: string | null;
  readonly isSubmittingMove: boolean;
  readonly onBackToLobby: () => void;
  readonly onSelectCell: (position: number) => void;
  readonly backLabel?: string;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly lead?: string;
}

export function MultiplayerGamePage({
  game,
  renderableGameState,
  localPlayer,
  connectionState,
  feedbackMessage,
  requestError,
  isSubmittingMove,
  onBackToLobby,
  onSelectCell,
  backLabel = 'Back to Lobby',
  eyebrow = 'Phase 2 · Multiplayer Match',
  title = 'Live Server-Backed Tic Tac Toe',
  lead = `Game ID ${game.id}. Moves are sent to the server for validation and broadcast
            to all connected listeners over WebSocket.`,
}: MultiplayerGamePageProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [celebrationState, setCelebrationState] = useState<'win' | 'loss' | 'draw' | null>(null);
  const previousMoveCountRef = useRef(renderableGameState.moves.length);
  const previousStatusRef = useRef(game.status);
  const canMove =
    game.status === 'active' &&
    localPlayer !== null &&
    game.currentPlayer === localPlayer &&
    connectionState === 'connected' &&
    !isSubmittingMove;
  const statusMessage = getStatusMessage(game, localPlayer, connectionState);

  const hoverHint = useMemo(() => {
    if (hoveredCell === null) {
      if (game.status === 'waiting') {
        return 'Share this game with a second client so another player can join.';
      }

      if (canMove) {
        return 'Your move is live. Pick any open square to place your mark.';
      }

      if (game.status === 'active') {
        return 'Waiting for the remote player to move.';
      }

      return 'The match is over. Review the board or return to the lobby.';
    }

    if (renderableGameState.board[hoveredCell] !== null) {
      return `Cell ${hoveredCell} is already occupied.`;
    }

    return canMove ? `Cell ${hoveredCell} is available.` : 'This move is not available right now.';
  }, [canMove, game.status, hoveredCell, renderableGameState.board]);

  useEffect(() => {
    if (renderableGameState.moves.length > previousMoveCountRef.current) {
      playTone(game.currentPlayer === localPlayer ? 330 : 220, 0.08, 'triangle');
    }

    previousMoveCountRef.current = renderableGameState.moves.length;
  }, [game.currentPlayer, localPlayer, renderableGameState.moves.length]);

  useEffect(() => {
    if (game.status === previousStatusRef.current) {
      return;
    }

    previousStatusRef.current = game.status;

    if (game.status === 'over' && game.endReason === 'draw') {
      setCelebrationState('draw');
      playTone(420, 0.12, 'square');
      return;
    }

    if (game.status === 'over' && game.winner !== null) {
      const didWin = game.winner === localPlayer;
      setCelebrationState(didWin ? 'win' : 'loss');
      playTone(didWin ? 660 : 180, didWin ? 0.12 : 0.18, didWin ? 'triangle' : 'sawtooth');
      return;
    }

    setCelebrationState(null);
  }, [game.endReason, game.status, game.winner, localPlayer]);

  return (
    <main className="app-shell">
      <section className={`game-layout${celebrationState ? ` game-layout--${celebrationState}` : ''}`}>
        {celebrationState === 'win' ? (
          <div className="celebration-banner celebration-banner--win">Remote victory confirmed.</div>
        ) : null}
        {celebrationState === 'loss' ? (
          <div className="celebration-banner celebration-banner--loss">Remote loss confirmed.</div>
        ) : null}
        {celebrationState === 'draw' ? (
          <div className="celebration-banner celebration-banner--draw">Multiplayer draw.</div>
        ) : null}
        <section className="hero-card game-panel">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          <div className="status-row">
            <span className="status-pill">Role: {localPlayer ?? 'Observer'}</span>
            <span className="status-pill">Turn: {game.currentPlayer ?? 'Waiting'}</span>
            <span className="status-pill">Socket: {connectionState}</span>
            <span className="status-pill">Status: {game.status.toUpperCase()}</span>
          </div>
          <div className="status-callout">
            <p className="eyebrow">Match Status</p>
            <h2>{statusMessage.title}</h2>
            <p>{statusMessage.body}</p>
          </div>
          <div className="hero-actions">
            <button className="secondary-button" onClick={onBackToLobby} type="button">
              {backLabel}
            </button>
          </div>
          {requestError ? <p className="feedback-banner">{requestError}</p> : null}
          {feedbackMessage ? <p className="feedback-banner feedback-banner--info">{feedbackMessage}</p> : null}
        </section>

        <section className="board-panel info-card">
          <div className="board-panel__header">
            <h2>Board</h2>
            <p>{hoverHint}</p>
          </div>
          <BoardPreview
            board={renderableGameState.board}
            highlightCells={renderableGameState.winningLine ?? []}
            interactive={canMove}
            canSelectCell={(position) =>
              canMove && renderableGameState.status === 'active' && renderableGameState.board[position] === null
            }
            onHoverCell={setHoveredCell}
            onSelectCell={onSelectCell}
            selectedCell={hoveredCell}
          />
        </section>

        <section className="info-card">
          <h2>Match Detail</h2>
          <dl className="domain-summary">
            <div>
              <dt>Host</dt>
              <dd>{game.players.host.sessionId.slice(0, 12)}</dd>
            </div>
            <div>
              <dt>Guest</dt>
              <dd>{game.players.guest ? game.players.guest.sessionId.slice(0, 12) : 'Waiting'}</dd>
            </div>
            <div>
              <dt>Moves</dt>
              <dd>{game.moves.length}</dd>
            </div>
            <div>
              <dt>End Reason</dt>
              <dd>{game.endReason ?? 'None'}</dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}

function getStatusMessage(
  game: MultiplayerGameState,
  localPlayer: 'X' | 'O' | null,
  connectionState: 'connecting' | 'connected' | 'disconnected',
) {
  if (connectionState !== 'connected') {
    return {
      title: connectionState === 'connecting' ? 'Connecting to live updates.' : 'Realtime connection lost.',
      body:
        connectionState === 'connecting'
          ? 'The browser is opening the game WebSocket so live state stays synchronized.'
          : 'This client is not currently receiving live events. Return to the lobby or refresh once the connection returns.',
    };
  }

  if (game.status === 'waiting') {
    return {
      title: 'Waiting for a second player.',
      body: 'The host seat is occupied. Open another browser window and join this game from the multiplayer lobby.',
    };
  }

  if (game.status === 'over' && game.endReason === 'draw') {
    return {
      title: 'The match ended in a draw.',
      body: 'No moves remain. Return to the lobby to create or join another game.',
    };
  }

  if (game.status === 'over' && game.winner !== null) {
    if (localPlayer === null) {
      return {
        title: `Player ${game.winner} won the match.`,
        body: 'The server closed the round and preserved the full move history for replay and spectator catch-up.',
      };
    }

    const didWin = localPlayer !== null && game.winner === localPlayer;

    return {
      title: didWin ? 'You won the multiplayer round.' : 'The other player won the multiplayer round.',
      body: 'The server closed the round and preserved the full move history for replay and catch-up.',
    };
  }

  if (localPlayer !== null && game.currentPlayer === localPlayer) {
    return {
      title: 'Your move is live.',
      body: 'Choose an open square. The server will validate the command and broadcast it to both clients.',
    };
  }

  if (localPlayer === null && game.status === 'active') {
    return {
      title: 'Watching a live match.',
      body: 'Moves are still controlled by the two players. This spectator view updates automatically when the server broadcasts each turn.',
    };
  }

  return {
    title: 'Waiting on the remote move.',
    body: 'The current player is on another client. This board will update asynchronously when the server broadcasts the move.',
  };
}

function playTone(frequency: number, duration: number, type: OscillatorType) {
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  const audioContext = new AudioContextConstructor();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(0.03, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
  oscillator.onended = () => {
    void audioContext.close();
  };
}
