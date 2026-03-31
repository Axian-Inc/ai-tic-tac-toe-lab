import { useEffect, useMemo, useRef, useState } from 'react';
import { BoardPreview } from '../features/game/components/BoardPreview';
import { canPlayMove, type GameState } from '../features/game/model';

interface GamePageProps {
  readonly gameState: GameState;
  readonly onQuit: () => void;
  readonly onRematch: () => void;
  readonly onSelectCell: (position: number) => void;
}

export function GamePage({ gameState, onQuit, onRematch, onSelectCell }: GamePageProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [celebrationState, setCelebrationState] = useState<'win' | 'loss' | 'draw' | null>(null);
  const previousMoveCountRef = useRef(gameState.moves.length);
  const previousStatusRef = useRef(gameState.status);
  const isCpuTurn = gameState.status === 'active' && gameState.currentPlayer === 'O';
  const canRematch = gameState.isGameOver;
  const statusMessage = getStatusMessage(gameState);
  const hoverHint = useMemo(() => {
    if (hoveredCell === null) {
      return isCpuTurn ? 'CPU is thinking...' : 'Hover over the board to inspect each square.';
    }

    if (canPlayMove(gameState, hoveredCell)) {
      return `Cell ${hoveredCell} is available for your next move.`;
    }

    if (gameState.board[hoveredCell] !== null) {
      return `Cell ${hoveredCell} is already occupied.`;
    }

    if (gameState.isGameOver) {
      return 'The game is over. Start a rematch to play again.';
    }

    return 'This move is not available right now.';
  }, [gameState, hoveredCell, isCpuTurn]);

  useEffect(() => {
    if (gameState.moves.length > previousMoveCountRef.current) {
      playTone(gameState.currentPlayer === 'O' ? 330 : 220, 0.08, 'triangle');
    }

    previousMoveCountRef.current = gameState.moves.length;
  }, [gameState.currentPlayer, gameState.moves.length]);

  useEffect(() => {
    if (gameState.status === previousStatusRef.current) {
      return;
    }

    previousStatusRef.current = gameState.status;

    if (gameState.status === 'won' && gameState.winner === 'X') {
      setCelebrationState('win');
      playTone(660, 0.12, 'triangle');
      window.setTimeout(() => playTone(880, 0.15, 'triangle'), 120);
      return;
    }

    if (gameState.status === 'won' && gameState.winner === 'O') {
      setCelebrationState('loss');
      playTone(180, 0.18, 'sawtooth');
      return;
    }

    if (gameState.status === 'draw') {
      setCelebrationState('draw');
      playTone(420, 0.12, 'square');
      return;
    }

    setCelebrationState(null);
  }, [gameState.status, gameState.winner]);

  useEffect(() => {
    if (feedbackMessage === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [feedbackMessage]);

  function requestCellSelection(position: number) {
    if (canPlayMove(gameState, position)) {
      onSelectCell(position);
      return;
    }

    if (gameState.isGameOver) {
      setFeedbackMessage('This game is over. Start a rematch to keep playing.');
    } else if (gameState.board[position] !== null) {
      setFeedbackMessage(`Cell ${position} is already taken.`);
    } else {
      setFeedbackMessage('That move is not available right now.');
    }

    playTone(140, 0.08, 'square');
  }

  return (
    <main className="app-shell">
      <section className={`game-layout${celebrationState ? ` game-layout--${celebrationState}` : ''}`}>
        {celebrationState === 'win' ? (
          <div className="celebration-banner celebration-banner--win">Victory achieved.</div>
        ) : null}
        {celebrationState === 'loss' ? (
          <div className="celebration-banner celebration-banner--loss">Try again.</div>
        ) : null}
        {celebrationState === 'draw' ? (
          <div className="celebration-banner celebration-banner--draw">Draw game.</div>
        ) : null}
        <section className="hero-card game-panel">
          <p className="eyebrow">Single-Player Match</p>
          <h1>Deterministic Tic Tac Toe</h1>
          <p className="lead">
            Play as X against the deterministic CPU. Use the board to make your move,
            quit when needed, or start a rematch after the round ends.
          </p>
          <div className="status-row">
            <span className="status-pill">Turn: {gameState.currentPlayer}</span>
            <span className="status-pill">Moves: {gameState.moves.length}</span>
            <span className="status-pill">Status: {gameState.status.toUpperCase()}</span>
          </div>
          <div className="status-callout">
            <p className="eyebrow">Game Status</p>
            <h2>{statusMessage.title}</h2>
            <p>{statusMessage.body}</p>
          </div>
          <div className="hero-actions">
            <button className="secondary-button" onClick={onQuit} type="button">
              Quit Game
            </button>
            {canRematch ? (
              <button className="primary-button" onClick={onRematch} type="button">
                Rematch
              </button>
            ) : null}
          </div>
        </section>

        <section className="board-panel info-card">
          <div className="board-panel__header">
            <h2>Board</h2>
            <p>{hoverHint}</p>
          </div>
          <BoardPreview
            board={gameState.board}
            highlightCells={gameState.winningLine ?? []}
            interactive={!isCpuTurn && !gameState.isGameOver}
            canSelectCell={(position) => canPlayMove(gameState, position)}
            onHoverCell={setHoveredCell}
            onSelectCell={requestCellSelection}
            selectedCell={hoveredCell}
          />
          {feedbackMessage ? <p className="feedback-banner">{feedbackMessage}</p> : null}
        </section>

        <section className="info-card">
          <h2>Game Detail</h2>
          <dl className="domain-summary">
            <div>
              <dt>Status</dt>
              <dd>{gameState.status}</dd>
            </div>
            <div>
              <dt>Winner</dt>
              <dd>{gameState.winner ?? 'None'}</dd>
            </div>
            <div>
              <dt>Available Moves</dt>
              <dd>{gameState.availableMoves.length}</dd>
            </div>
            <div>
              <dt>Last Move</dt>
              <dd>
                {gameState.moves.length > 0
                  ? `${gameState.moves.at(-1)?.player} @ ${gameState.moves.at(-1)?.position}`
                  : 'None'}
              </dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}

function getStatusMessage(gameState: GameState) {
  if (gameState.status === 'won' && gameState.winner === 'X') {
    return {
      title: 'You won this round.',
      body: 'The game is over. Review the board or start a rematch against the same deterministic CPU.',
    };
  }

  if (gameState.status === 'won' && gameState.winner === 'O') {
    return {
      title: 'The CPU won this round.',
      body: 'The game is over. You can study the final board or run it back with a rematch.',
    };
  }

  if (gameState.status === 'draw') {
    return {
      title: 'The game ended in a draw.',
      body: 'No moves remain. Start a rematch to try a different line of play.',
    };
  }

  if (gameState.currentPlayer === 'O') {
    return {
      title: 'Waiting on the CPU move.',
      body: 'The deterministic CPU is taking its turn. The board will update automatically.',
    };
  }

  return {
    title: 'Your turn.',
    body: 'Pick any open square to place X. Occupied cells and finished games will ignore input.',
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
