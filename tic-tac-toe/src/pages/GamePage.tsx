import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  HUMAN_PLAYER,
  chooseCpuMove,
  cpuMove,
  playerMove,
  selectAvailableMoves,
  selectBoard,
  selectIsDraw,
  selectWinner,
  selectXIsNext,
  startNewGame,
} from '../features/game/gameSlice';

type GameOutcome = 'win' | 'lose' | 'draw';

function GamePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const board = useAppSelector(selectBoard);
  const xIsNext = useAppSelector(selectXIsNext);
  const winner = useAppSelector(selectWinner);
  const isDraw = useAppSelector(selectIsDraw);
  const availableMoves = useAppSelector(selectAvailableMoves);
  const previousBoardRef = React.useRef<Array<string | null> | null>(null);

  const status = winner
    ? winner === HUMAN_PLAYER
      ? 'You win!'
      : 'CPU wins!'
    : isDraw
      ? 'Draw!'
      : xIsNext
        ? 'Your turn (X)'
        : 'CPU is thinking...';

  React.useEffect(() => {
    dispatch(startNewGame());
  }, [dispatch]);

  React.useEffect(() => {
    if (xIsNext || winner || isDraw || availableMoves.length === 0) {
      return;
    }

    const cpuTimer = setTimeout(() => {
      const deterministicMove = chooseCpuMove(board, availableMoves);
      if (deterministicMove !== null) {
        dispatch(cpuMove(deterministicMove));
      }
    }, 450);

    return () => clearTimeout(cpuTimer);
  }, [xIsNext, winner, isDraw, availableMoves, board, dispatch]);

  React.useEffect(() => {
    if (!winner && !isDraw) {
      return;
    }

    const outcome: GameOutcome = isDraw
      ? 'draw'
      : winner === HUMAN_PLAYER
        ? 'win'
        : 'lose';

    const navigateTimer = setTimeout(() => {
      navigate(`/result/${outcome}`);
    }, 600);

    return () => clearTimeout(navigateTimer);
  }, [winner, isDraw, navigate]);

  React.useEffect(() => {
    if (winner || isDraw) {
      previousBoardRef.current = board;
      return;
    }

    const previousBoard = previousBoardRef.current;
    previousBoardRef.current = board;

    if (!previousBoard) {
      return;
    }

    const piecePlaced = board.some(
      (cell, index) => cell !== null && previousBoard[index] === null
    );

    if (!piecePlaced) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.24);

    const timeout = window.setTimeout(() => {
      audioContext.close().catch(() => undefined);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      audioContext.close().catch(() => undefined);
    };
  }, [board, winner, isDraw]);

  return (
    <main className="app">
      <h1>Tic-Tac-Toe</h1>
      <p className="status">{status}</p>

      <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => (
          <button
            key={index}
            className={`square${cell === null && xIsNext && !winner && !isDraw ? ' is-available' : ''}`}
            onClick={() => dispatch(playerMove(index))}
            disabled={cell !== null || !xIsNext || !!winner || isDraw}
            aria-label={`Square ${index + 1}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="reset" onClick={() => dispatch(startNewGame())}>
          Restart game
        </button>
        <button className="reset secondary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default GamePage;
