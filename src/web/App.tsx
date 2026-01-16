import { useMemo, useState } from 'react';

import type { ApiClient, ApiError } from '../shared/apiClient';
import { createApiClient } from '../shared/apiClient';
import type { GameState } from '../shared/gameState';
import { findWinningLine } from '../shared/gameRules';

import './App.css';

type PlayerSymbol = 'X' | 'O';

type AppProps = {
  apiBaseUrl?: string;
  apiClient?: ApiClient;
};

const opponentOptions = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'defensive', label: 'Defensive' },
];

const emptyBoard = Array.from({ length: 9 }, () => null as PlayerSymbol | null);

const initialStatus = 'Start a new game to play.';

const formatStatus = (state: GameState | null): string => {
  if (!state) {
    return initialStatus;
  }

  if (state.gameStatus === 'win') {
    return `Winner: ${state.winner ?? 'Unknown'}`;
  }

  if (state.gameStatus === 'draw') {
    return 'Draw game.';
  }

  return `Next player: ${state.nextPlayer}`;
};

export const App = ({ apiBaseUrl = '', apiClient }: AppProps) => {
  const client = useMemo(
    () => apiClient ?? createApiClient({ baseUrl: apiBaseUrl }),
    [apiBaseUrl, apiClient],
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [startingPlayer, setStartingPlayer] = useState<PlayerSymbol>('X');
  const [opponentId, setOpponentId] = useState<string>('balanced');
  const [aiRationale, setAiRationale] = useState<string | undefined>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const board = gameState?.board ?? emptyBoard;
  const winningLine =
    gameState?.gameStatus === 'win' ? findWinningLine(gameState.board) : null;
  const statusText = formatStatus(gameState);

  const handleNewGame = async () => {
    setIsLoading(true);
    setError(null);
    setAiRationale(undefined);

    const result = await client.newGame({ startingPlayer, opponentId });
    if (result.ok) {
      setGameState(result.data);
    } else {
      setGameState(null);
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleCellClick = async (index: number) => {
    if (!gameState || isLoading) {
      return;
    }

    if (gameState.gameStatus !== 'in_progress') {
      return;
    }

    if (gameState.board[index] !== null) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setAiRationale(undefined);

    const result = await client.move({ state: gameState, playerMoveIndex: index });
    if (result.ok) {
      setGameState(result.data.state);
      setAiRationale(result.data.aiRationale);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Tic-Tac-Toe POC</p>
          <h1 className="app__title">Play Against AI</h1>
          <p className="app__subtitle">One move at a time. Keep your eye on the center.</p>
        </div>
        <div className="app__status" data-testid="status">
          {statusText}
        </div>
      </header>

      <main className="app__layout">
        <section className="panel panel--controls">
          <div className="panel__field">
            <label htmlFor="starting-player">Starting player</label>
            <select
              id="starting-player"
              value={startingPlayer}
              onChange={(event) => setStartingPlayer(event.target.value as PlayerSymbol)}
            >
              <option value="X">X</option>
              <option value="O">O</option>
            </select>
          </div>

          <div className="panel__field">
            <label htmlFor="opponent">Opponent profile</label>
            <select
              id="opponent"
              value={opponentId}
              onChange={(event) => setOpponentId(event.target.value)}
            >
              {opponentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button className="button" type="button" onClick={handleNewGame} disabled={isLoading}>
            Start New Game
          </button>

          <div className="panel__info">
            <p className="panel__label">Opponent</p>
            <p className="panel__value">
              {opponentOptions.find((option) => option.id === opponentId)?.label}
            </p>
          </div>
          <div className="panel__info">
            <p className="panel__label">Session</p>
            <p className="panel__value">{gameState?.sessionId ?? 'Not started'}</p>
          </div>
        </section>

        <section className="panel panel--board">
          <div className="board" role="grid" aria-label="Tic-tac-toe board">
            {board.map((cell, index) => (
              <button
                key={`cell-${index}`}
                type="button"
                className={`board__cell${
                  winningLine?.includes(index) ? ' board__cell--winning' : ''
                }`}
                aria-label={`Cell ${index}`}
                onClick={() => handleCellClick(index)}
                disabled={isLoading || cell !== null || gameState?.gameStatus !== 'in_progress'}
              >
                <span>{cell ?? ''}</span>
              </button>
            ))}
          </div>
          {aiRationale ? (
            <div className="panel__rationale" aria-live="polite">
              <p className="panel__label">AI rationale</p>
              <p className="panel__value">{aiRationale}</p>
            </div>
          ) : null}
        </section>
      </main>

      {error ? (
        <div className="app__error" role="alert">
          <strong>ERROR {error.errorCode}:</strong> {error.message}
        </div>
      ) : null}
    </div>
  );
};
