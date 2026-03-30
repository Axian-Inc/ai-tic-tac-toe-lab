import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setGameMode } from '../features/app/appSlice';
import { usePiecePlacedSound } from '../hooks/usePiecePlacedSound';
import {
  chooseCpuMove,
  cpuMove,
  selectAvailableMoves,
  selectBoard,
  selectIsDraw,
  selectWinner,
  selectXIsNext,
  startNewGame,
  playerMove,
} from '../features/game/gameSlice';

function SinglePlayerPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const board = useAppSelector(selectBoard);
  const xIsNext = useAppSelector(selectXIsNext);
  const winner = useAppSelector(selectWinner);
  const isDraw = useAppSelector(selectIsDraw);
  const availableMoves = useAppSelector(selectAvailableMoves);
  const [isCpuThinking, setIsCpuThinking] = React.useState(false);

  React.useEffect(() => {
    dispatch(setGameMode('single'));
    dispatch(startNewGame());
  }, [dispatch]);

  React.useEffect(() => {
    if (!winner && !isDraw) {
      return;
    }

    const outcome = winner === 'X' ? 'win' : winner === 'O' ? 'lose' : 'draw';
    const timer = window.setTimeout(() => {
      navigate(`/result/${outcome}`);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [winner, isDraw, navigate]);

  React.useEffect(() => {
    if (xIsNext || winner || isDraw) {
      setIsCpuThinking(false);
      return;
    }

    const move = chooseCpuMove(board, availableMoves);
    if (move === null) {
      return;
    }

    setIsCpuThinking(true);
    const timer = window.setTimeout(() => {
      dispatch(cpuMove(move));
      setIsCpuThinking(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [xIsNext, winner, isDraw, board, availableMoves, dispatch]);

  usePiecePlacedSound(board, !winner && !isDraw);

  const handlePlayerMove = (index: number) => {
    if (!xIsNext || winner || isDraw || board[index]) {
      return;
    }

    dispatch(playerMove(index));
  };

  const status = (() => {
    if (winner === 'X') {
      return 'You win!';
    }

    if (winner === 'O') {
      return 'CPU wins!';
    }

    if (isDraw) {
      return 'Draw!';
    }

    if (xIsNext) {
      return 'Your turn (X)';
    }

    return isCpuThinking ? 'CPU thinking...' : 'CPU turn (O)';
  })();

  return (
    <main className="app">
      <h1>Single Player</h1>
      <p className="status">{status}</p>
      <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => {
          const isClickable = xIsNext && !winner && !isDraw && board[index] === null;

          return (
            <button
              key={index}
              className={`square${isClickable ? ' is-available' : ''}`}
              onClick={() => handlePlayerMove(index)}
              disabled={!isClickable}
              aria-label={`Square ${index + 1}`}
            >
              {cell}
            </button>
          );
        })}
      </div>
      <div className="actions">
        <button className="reset secondary" onClick={() => dispatch(startNewGame())}>
          Reset Game
        </button>
        <button className="reset" onClick={() => navigate('/')}>
          Back Home
        </button>
      </div>
    </main>
  );
}

export default SinglePlayerPage;
