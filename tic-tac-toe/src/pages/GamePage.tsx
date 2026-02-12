import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  HUMAN_PLAYER,
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
      const randomMove =
        availableMoves[Math.floor(Math.random() * availableMoves.length)];
      dispatch(cpuMove(randomMove));
    }, 450);

    return () => clearTimeout(cpuTimer);
  }, [xIsNext, winner, isDraw, availableMoves, dispatch]);

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

  return (
    <main className="app">
      <h1>Tic-Tac-Toe</h1>
      <p className="status">{status}</p>

      <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => (
          <button
            key={index}
            className="square"
            onClick={() => dispatch(playerMove(index))}
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
