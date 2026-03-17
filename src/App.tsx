import { useEffect, useState } from 'react';
import type { Mark, MarkSelection, BoardCell, GameSession, GameState } from './types';
import {
  createSession,
  createInitialGameState,
  validateMove,
  makeMove,
  determineOutcome,
  getRandomStartingPlayer,
  getCpuMove,
} from './game';

type SquareUiState = 'playable' | 'occupied' | 'unavailable';

const MARK_OPTIONS: Array<{
  value: MarkSelection;
  label: string;
  description: string;
}> = [
  {
    value: 'X',
    label: 'Play as X',
    description: 'Start with the classic first-player mark.',
  },
  {
    value: 'O',
    label: 'Play as O',
    description: 'Let the CPU open as X while you play O.',
  },
  {
    value: 'Random',
    label: 'Random draw',
    description: 'Let the app assign your mark at game start.',
  },
];

function getStatusText(currentTurn: Mark, session: GameSession, phase: GameState['phase']) {
  if (phase === 'finished') {
    return 'Round complete. You can rematch or quit to landing.';
  }

  return currentTurn === session.playerMark
    ? 'Your turn. Choose a highlighted square.'
    : "CPU's turn. Player input is locked.";
}

function getFeedbackText(validation: ReturnType<typeof validateMove>): string {
  if (validation.success) {
    return 'Move accepted. The board is now locked while the CPU turn is pending.';
  }

  return validation.reason === 'occupied'
    ? 'Illegal move blocked. Occupied squares are unavailable.'
    : "Illegal move blocked. Wait until it's your turn.";
}

function getOutcomeFeedback(outcome: ReturnType<typeof determineOutcome>): string {
  if (outcome.status === 'won') {
    return outcome.winner === 'X'
      ? 'X wins the round! Ready for a rematch?'
      : 'O wins the round! Ready for a rematch?';
  }

  if (outcome.status === 'draw') {
    return 'The round ended in a draw! Ready for a rematch?';
  }

  return '';
}

function getInitialFeedbackText(session: GameSession): string {
  return session.startingPlayer === 'cpu'
    ? 'CPU opens this round. Player input stays locked until its move lands.'
    : 'Playable squares glow on hover. Occupied or locked squares stay muted.';
}

function getSquareUiState(cell: BoardCell, currentTurn: Mark, playerMark: Mark): SquareUiState {
  if (cell) {
    return 'occupied';
  }

  if (currentTurn !== playerMark) {
    return 'unavailable';
  }

  return 'playable';
}

function getMarkClasses(mark: Mark) {
  if (mark === 'X') {
    return 'text-cyan-300 drop-shadow-[0_0_22px_rgba(34,211,238,0.65)]';
  }

  return 'text-orange-400 drop-shadow-[0_0_22px_rgba(251,146,60,0.65)]';
}

function App() {
  const [selection, setSelection] = useState<MarkSelection>('X');
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!session || !gameState) {
      return;
    }

    if (gameState.phase !== 'active' || gameState.currentTurn !== session.cpuMark) {
      return;
    }

    const cpuMoveIndex = getCpuMove(gameState.board, session.cpuMark);

    if (cpuMoveIndex === null) {
      const outcome = determineOutcome(gameState.board);

      setGameState({
        ...gameState,
        phase: outcome.status === 'active' ? 'finished' : 'finished',
        winner: outcome.status === 'won' ? outcome.winner : null,
        statusText: getStatusText(session.playerMark, session, 'finished'),
        feedbackText:
          outcome.status === 'active'
            ? 'No legal CPU move remained. Round closed.'
            : getOutcomeFeedback(outcome),
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGameState((currentState) => {
        if (
          !currentState ||
          currentState.phase !== 'active' ||
          currentState.currentTurn !== session.cpuMark
        ) {
          return currentState;
        }

        const { newBoard, nextTurn, newMoveHistory } = makeMove(
          currentState.board,
          cpuMoveIndex,
          session.cpuMark,
          currentState.moveHistory,
        );
        const outcome = determineOutcome(newBoard);

        if (outcome.status === 'active') {
          return {
            board: newBoard,
            currentTurn: nextTurn,
            moveHistory: newMoveHistory,
            statusText: getStatusText(nextTurn, session, 'active'),
            feedbackText: 'CPU moved. Your highlighted squares are live again.',
            phase: 'active',
            winner: null,
          };
        }

        return {
          board: newBoard,
          currentTurn: session.playerMark,
          moveHistory: newMoveHistory,
          statusText: getStatusText(session.playerMark, session, 'finished'),
          feedbackText: getOutcomeFeedback(outcome),
          phase: 'finished',
          winner: outcome.status === 'won' ? outcome.winner : null,
        };
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session, gameState]);

  const startGame = () => {
    const nextSession = createSession(selection);
    const initialGameState = createInitialGameState(nextSession);

    setSession(nextSession);
    setGameState({
      ...initialGameState,
      statusText: getStatusText(initialGameState.currentTurn, nextSession, initialGameState.phase),
      feedbackText: getInitialFeedbackText(nextSession),
    });
  };

  const handleSquareActivate = (index: number) => {
    if (!session || !gameState) {
      return;
    }

    const validation = validateMove(
      gameState.board,
      index,
      gameState.currentTurn,
      session.playerMark,
    );

    if (!validation.success) {
      setGameState({
        ...gameState,
        feedbackText: getFeedbackText(validation),
        statusText: getStatusText(gameState.currentTurn, session, gameState.phase),
      });
      return;
    }

    const { newBoard, nextTurn, newMoveHistory } = makeMove(
      gameState.board,
      index,
      session.playerMark,
      gameState.moveHistory,
    );
    const outcome = determineOutcome(newBoard);

    if (outcome.status === 'active') {
      setGameState({
        board: newBoard,
        currentTurn: nextTurn,
        moveHistory: newMoveHistory,
        statusText: getStatusText(nextTurn, session, 'active'),
        feedbackText: getFeedbackText({ success: true }),
        phase: 'active',
        winner: null,
      });
    } else if (outcome.status === 'won') {
      setGameState({
        board: newBoard,
        currentTurn: session.playerMark,
        moveHistory: newMoveHistory,
        statusText: getStatusText(session.playerMark, session, 'finished'),
        feedbackText: getOutcomeFeedback(outcome),
        phase: 'finished',
        winner: outcome.winner,
      });
    } else if (outcome.status === 'draw') {
      setGameState({
        board: newBoard,
        currentTurn: session.playerMark,
        moveHistory: newMoveHistory,
        statusText: getStatusText(session.playerMark, session, 'finished'),
        feedbackText: getOutcomeFeedback(outcome),
        phase: 'finished',
        winner: null,
      });
    }
  };

  const startRematch = () => {
    if (!session) {
      return;
    }

    const nextSession = createSession(session.selection, {
      roundNumber: session.roundNumber + 1,
      startingPlayer: getRandomStartingPlayer(),
    });
    const initialGameState = createInitialGameState(nextSession);

    setSession(nextSession);
    setGameState({
      ...initialGameState,
      statusText: getStatusText(initialGameState.currentTurn, nextSession, initialGameState.phase),
      feedbackText: getInitialFeedbackText(nextSession),
    });
  };

  const quitToLanding = () => {
    setSession(null);
    setGameState(null);
  };

  if (session && gameState) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.3em] text-amber-300 uppercase">
              Round {session.roundNumber}
            </p>
            <p className="mt-2 text-xl font-bold">{gameState.statusText}</p>
            {gameState.feedbackText && (
              <p className="mt-1 text-sm text-slate-400">{gameState.feedbackText}</p>
            )}
          </div>

          <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <section className="rounded-3xl border border-cyan-300/25 bg-cyan-400/8 p-5 text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-cyan-200 uppercase">
                Player Mark
              </p>
              <p
                data-testid="player-mark"
                className={`mt-3 text-4xl font-black ${getMarkClasses(session.playerMark)}`}
              >
                {session.playerMark}
              </p>
            </section>

            <section className="rounded-3xl border border-orange-300/25 bg-orange-400/8 p-5 text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-orange-200 uppercase">
                CPU Mark
              </p>
              <p
                data-testid="cpu-mark"
                className={`mt-3 text-4xl font-black ${getMarkClasses(session.cpuMark)}`}
              >
                {session.cpuMark}
              </p>
            </section>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {gameState.board.map((cell, index) => {
              const uiState = getSquareUiState(cell, gameState.currentTurn, session.playerMark);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={uiState !== 'playable'}
                  onClick={() => handleSquareActivate(index)}
                  className={`aspect-square flex items-center justify-center rounded-xl text-5xl font-black transition ${
                    uiState === 'playable'
                      ? 'bg-amber-300/20 text-amber-100 hover:bg-amber-300/30'
                      : uiState === 'occupied'
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {cell && <span className={getMarkClasses(cell)}>{cell}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {gameState.phase === 'active' ? (
              <>
                <button
                  type="button"
                  onClick={quitToLanding}
                  className="rounded-full border border-orange-300/45 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-200 hover:bg-orange-400/18"
                >
                  Quit to landing
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startRematch}
                  className="rounded-full border border-emerald-300/45 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/18"
                >
                  Rematch
                </button>
                <button
                  type="button"
                  onClick={quitToLanding}
                  className="rounded-full border border-orange-300/45 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-100 transition hover:border-orange-200 hover:bg-orange-400/18"
                >
                  Quit to landing
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7,_transparent_28%),radial-gradient(circle_at_bottom_right,_#fecdd3,_transparent_24%),linear-gradient(180deg,_#fff7ed_0%,_#f8fafc_60%,_#ffffff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-8 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[2rem] border border-amber-200/70 bg-white/85 p-8 shadow-[0_28px_80px_-46px_rgba(120,53,15,0.4)] backdrop-blur sm:p-10">
          <p className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold tracking-wide text-amber-900 uppercase">
            Phase 1 Landing
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-balance sm:text-6xl">
            Pick your mark and challenge the CPU.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            This is the first gameplay entry point for the app: choose who you want to be, launch
            the match, and carry that selection into the started game session.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Local-only React app
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Deterministic CPU enabled
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              Keyboard-friendly controls
            </span>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.95)] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-amber-300 uppercase">
                Play vs CPU
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Choose your mark</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Default: X
            </div>
          </div>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold text-slate-300">
              Select one option before starting the game
            </legend>
            <div className="mt-4 grid gap-3">
              {MARK_OPTIONS.map((option) => {
                const isSelected = selection === option.value;

                return (
                  <label
                    key={option.value}
                    className={`group flex cursor-pointer items-start gap-4 rounded-3xl border px-4 py-4 transition ${
                      isSelected
                        ? 'border-amber-300 bg-amber-300/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/8'
                    }`}
                  >
                    <input
                      type="radio"
                      name="player-mark"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => setSelection(option.value)}
                      className="mt-1 h-4 w-4 border-white/30 bg-slate-900 text-amber-400 focus:ring-amber-300"
                    />
                    <span className="block">
                      <span className="block text-lg font-bold text-white">{option.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-300">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">Current selection</p>
            <p className="mt-2 text-3xl font-black">{selection}</p>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-amber-300 px-6 py-4 text-base font-black text-slate-950 transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Play vs CPU
          </button>
        </section>
      </div>
    </main>
  );
}

export default App;
