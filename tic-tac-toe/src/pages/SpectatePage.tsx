import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameEvent, MultiplayerGame, getGame, getGameWebSocketUrl, listActiveGames } from '../features/game/api';
import { usePiecePlacedSound } from '../hooks/usePiecePlacedSound';

function SpectatePage() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [games, setGames] = React.useState<MultiplayerGame[]>([]);
  const [game, setGame] = React.useState<MultiplayerGame | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = React.useState(false);
  const [isLoadingGame, setIsLoadingGame] = React.useState(false);
  const [isWsConnected, setIsWsConnected] = React.useState(false);

  const loadGames = React.useCallback(async () => {
    setIsLoadingList(true);
    setError(null);

    try {
      const nextGames = await listActiveGames();
      setGames(nextGames);
    } catch (requestError) {
      const errorCode = requestError instanceof Error ? requestError.message : 'REQUEST_FAILED';
      setError(errorCode);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const applyGameUpdate = React.useCallback((nextGame: MultiplayerGame) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return nextGame;
      }
      return currentGame.updatedAt > nextGame.updatedAt ? currentGame : nextGame;
    });
  }, []);

  React.useEffect(() => {
    if (!gameId) {
      setGame(null);
      setIsWsConnected(false);
      return;
    }

    let isMounted = true;
    let ws: WebSocket | null = null;

    const syncGameFromServer = async () => {
      setIsLoadingGame(true);
      setError(null);

      try {
        const nextGame = await getGame(gameId);
        if (isMounted) {
          applyGameUpdate(nextGame);
        }
      } catch (requestError) {
        const errorCode = requestError instanceof Error ? requestError.message : 'REQUEST_FAILED';
        if (isMounted) {
          setError(errorCode);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGame(false);
        }
      }
    };

    void syncGameFromServer();

    const wsUrl = getGameWebSocketUrl(gameId);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (isMounted) {
        setIsWsConnected(true);
      }
    };

    ws.onclose = () => {
      if (isMounted) {
        setIsWsConnected(false);
      }
    };

    ws.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as GameEvent;
        if ((event.type === 'game.joined' || event.type === 'game.updated') && event.game) {
          applyGameUpdate(event.game);
        }
      } catch {
        // Ignore malformed websocket messages.
      }
    };

    return () => {
      isMounted = false;
      ws?.close();
    };
  }, [gameId, applyGameUpdate]);

  React.useEffect(() => {
    if (!gameId) {
      void loadGames();
    }
  }, [gameId, loadGames]);

  const status = (() => {
    if (isLoadingGame) {
      return 'Loading game...';
    }

    if (!game) {
      return 'Select a game to spectate.';
    }

    if (game.status === 'waiting') {
      return 'Waiting for players to join.';
    }

    if (game.status === 'over' && game.winner) {
      return `Game over. Winner: ${game.winner}.`;
    }

    if (game.status === 'over') {
      return 'Game over. Draw.';
    }

    return `Next turn: ${game.nextTurn}`;
  })();

  const board = game ? game.board : Array(9).fill(null);
  usePiecePlacedSound(game ? game.board : null, !!game && game.status !== 'over');

  if (!gameId) {
    return (
      <main className="app">
        <section className="landing">
          <h1>Spectate</h1>
          <p className="mode-message">
            Pick an active game to watch live.
          </p>
          {error ? <p className="error-message">Error: {error}</p> : null}
          <div className="spectate-actions">
            <button className="reset" type="button" onClick={() => void loadGames()} disabled={isLoadingList}>
              {isLoadingList ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
          {games.length === 0 && !isLoadingList ? (
            <p className="session-info">No active games right now.</p>
          ) : (
            <div className="spectate-list">
              {games.map((activeGame) => (
                <div key={activeGame.id} className="spectate-item">
                  <div className="spectate-meta">
                    <span className="spectate-label">Game ID</span>
                    <span className="spectate-id">{activeGame.id}</span>
                    <span className="spectate-status">Status: {activeGame.status}</span>
                  </div>
                  <button
                    className="reset secondary"
                    type="button"
                    onClick={() => navigate(`/spectate/${activeGame.id}`)}
                  >
                    Spectate
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            className="reset"
            type="button"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Spectate</h1>
      <p className="status">{status}</p>
      {game ? (
        <div className="session-row">
          <p className="session-info">Game ID: {game.id}</p>
          <span
            className={`ws-indicator ${isWsConnected ? 'connected' : 'disconnected'}`}
            aria-label={isWsConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
            title={isWsConnected ? 'Realtime connected' : 'Realtime disconnected'}
          />
        </div>
      ) : null}
      {error ? <p className="error-message">Error: {error}</p> : null}
      <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => (
          <button
            key={index}
            className="square"
            disabled
            aria-label={`Square ${index + 1}`}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="actions">
        <button className="reset secondary" type="button" onClick={() => navigate('/spectate')}>
          Back to List
        </button>
        <button
          className="reset"
          type="button"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}

export default SpectatePage;
