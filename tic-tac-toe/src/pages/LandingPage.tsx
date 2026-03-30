import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectGameMode, setGameMode } from '../features/app/appSlice';
import { createGame, joinGame } from '../features/game/api';
import { writeGameSession } from '../features/game/session';

function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectGameMode);
  const [joinCode, setJoinCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const hostGame = async () => {
    setError(null);
    setIsLoading(true);

    try {
      dispatch(setGameMode('multi'));
      const payload = await createGame();
      writeGameSession({
        gameId: payload.game.id,
        playerId: payload.playerId,
        symbol: payload.assignedSymbol,
      });
      navigate('/game');
    } catch (requestError) {
      const errorCode = requestError instanceof Error ? requestError.message : 'REQUEST_FAILED';
      setError(errorCode);
    } finally {
      setIsLoading(false);
    }
  };

  const joinExistingGame = async () => {
    const trimmed = joinCode.trim();
    if (!trimmed) {
      setError('ENTER_GAME_ID');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      dispatch(setGameMode('multi'));
      const payload = await joinGame(trimmed);
      writeGameSession({
        gameId: payload.game.id,
        playerId: payload.playerId,
        symbol: payload.assignedSymbol,
      });
      navigate('/game');
    } catch (requestError) {
      const errorCode = requestError instanceof Error ? requestError.message : 'REQUEST_FAILED';
      setError(errorCode);
    } finally {
      setIsLoading(false);
    }
  };

  const startSinglePlayer = () => {
    dispatch(setGameMode('single'));
    navigate('/single');
  };

  return (
    <main className="app">
      <section className="landing">
        <div className="mode-toggle" role="group" aria-label="Game mode">
          <button
            className={`mode-button${mode === 'single' ? ' active' : ''}`}
            type="button"
            onClick={() => dispatch(setGameMode('single'))}
            disabled={isLoading}
          >
            Single Player
          </button>
          <button
            className={`mode-button${mode === 'multi' ? ' active' : ''}`}
            type="button"
            onClick={() => dispatch(setGameMode('multi'))}
            disabled={isLoading}
          >
            Multiplayer
          </button>
          <button
            className="mode-button"
            type="button"
            onClick={() => navigate('/spectate')}
            disabled={isLoading}
          >
            Spectate
          </button>
        </div>
        <p className="mode-message landing-greeting">
          <span className="landing-greeting-main">
            {mode === 'single' ? 'Single Player' : 'Multiplayer'}<br/>
            Tic-Tac-Toe
          </span>
          <span className="landing-greeting-sub">
            {mode === 'single'
              ? 'Play against the CPU right away.'
              : 'Create a game or join with a game ID.'}
          </span>
        </p>
        {mode === 'single' ? (
          <button className="start landing-cta" onClick={startSinglePlayer} disabled={isLoading}>
            Start Single Player
          </button>
        ) : (
          <>
            <button className="start landing-cta" onClick={hostGame} disabled={isLoading}>
              {isLoading ? 'Working...' : 'Host New Game'}
            </button>

            <input
              className="join-input"
              placeholder="Enter game ID"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              disabled={isLoading}
              aria-label="Game ID"
            />
            <button className="reset" onClick={joinExistingGame} disabled={isLoading}>
              Join Game
            </button>
          </>
        )}

        {error ? <p className="error-message">Error: {error}</p> : null}
      </section>
    </main>
  );
}

export default LandingPage;
