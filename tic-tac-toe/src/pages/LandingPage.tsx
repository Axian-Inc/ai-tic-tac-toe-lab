import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { startNewGame } from '../features/game/gameSlice';

function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (
    <main className="app">
      <section className="landing">
        <p className="mode-message landing-greeting">
          <span className="landing-greeting-main">Welcome back.</span>
          <span className="landing-greeting-sub">
            Start a new game and challenge the CPU.
          </span>
        </p>
        <button
          className="start landing-cta"
          onClick={() => {
            dispatch(startNewGame());
            navigate('/game');
          }}
        >
          Play vs. CPU
        </button>
      </section>
    </main>
  );
}

export default LandingPage;
