import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { startNewGame } from '../features/game/gameSlice';

type GameOutcome = 'win' | 'lose' | 'draw';

function ResultPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { outcome } = useParams<{ outcome: string }>();

  const messageByOutcome: Record<GameOutcome, string> = {
    win: 'You win!',
    lose: 'CPU wins!',
    draw: 'Draw!',
  };

  if (!outcome || !(outcome in messageByOutcome)) {
    return <Navigate to="/" replace />;
  }

  const outcomeMessage = messageByOutcome[outcome as GameOutcome];

  return (
    <main className="app">
      <section className="landing result-card">
        <p className="mode-message result-message">{outcomeMessage}</p>
        <div className="actions result-actions">
          <button
            className="start"
            onClick={() => {
              dispatch(startNewGame());
              navigate('/game');
            }}
          >
            Rematch
          </button>
          <button className="reset secondary" onClick={() => navigate('/')}>
            Home
          </button>
        </div>
      </section>
    </main>
  );
}

export default ResultPage;
