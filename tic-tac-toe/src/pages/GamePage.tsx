import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameEvent, MultiplayerGame, getGame, getGameWebSocketUrl, leaveGame, makeMove } from '../features/game/api';
import { clearGameSession, readGameSession } from '../features/game/session';

type GameOutcome = 'win' | 'lose' | 'draw';

function GamePage() {
  const navigate = useNavigate();
  const [game, setGame] = React.useState<MultiplayerGame | null>(null);
  const [playerId, setPlayerId] = React.useState<string | null>(null);
  const [playerSymbol, setPlayerSymbol] = React.useState<'X' | 'O' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copyMessage, setCopyMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmittingMove, setIsSubmittingMove] = React.useState(false);
  const [isWsConnected, setIsWsConnected] = React.useState(false);

  const previousBoardRef = React.useRef<Array<string | null> | null>(null);
  const applyGameUpdate = React.useCallback((nextGame: MultiplayerGame) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return nextGame;
      }

      return currentGame.updatedAt > nextGame.updatedAt ? currentGame : nextGame;
    });
  }, []);

  React.useEffect(() => {
    const session = readGameSession();
    if (!session) {
      navigate('/', { replace: true });
      return;
    }

    setPlayerId(session.playerId);
    setPlayerSymbol(session.symbol);

    let isMounted = true;
    let isActiveSocket = true;
    const wsUrl = getGameWebSocketUrl(session.gameId);
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const syncGameFromServer = async () => {
      try {
        const nextGame = await getGame(session.gameId);
        if (isMounted) {
          applyGameUpdate(nextGame);
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        const errorCode = requestError instanceof Error ? requestError.message : 'REQUEST_FAILED';
        setError(errorCode);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const clearWsTimers = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connectSocket = () => {
      if (!isActiveSocket) {
        return;
      }

      console.log('new WebSocket', Date.now());
      const socket = new WebSocket(wsUrl);
      ws = socket;
      setIsWsConnected(false);

      socket.onmessage = (messageEvent) => {
        if (!isActiveSocket || ws !== socket) {
          return;
        }

        try {
          if (typeof messageEvent.data !== 'string') {
            return;
          }

          const event = JSON.parse(messageEvent.data) as GameEvent;
          if (event.type === 'subscription.confirmed') {
            void syncGameFromServer();
            return;
          }

          if ((event.type === 'game.joined' || event.type === 'game.updated') && event.game) {
            applyGameUpdate(event.game);
            setError(null);
          }
        } catch {
          setError('WS_MESSAGE_PARSE_ERROR');
        }
      };

      socket.onopen = () => {
        console.log('Socket OnOpen', Date.now());
        if (!isActiveSocket || ws !== socket) {
          return;
        }

        setIsWsConnected(true);
        setError((current) => (current === 'WS_CONNECTION_ERROR' ? null : current));
        void syncGameFromServer();
      };

      socket.onerror = () => {
        if (!isActiveSocket || ws !== socket) {
          return;
        }

        setIsWsConnected(false);
        setError((current) => current ?? 'WS_CONNECTION_ERROR');
      };

      socket.onclose = () => {
        if (!isActiveSocket || ws !== socket) {
          return;
        }

        setIsWsConnected(false);
        reconnectTimer = window.setTimeout(() => {
          connectSocket();
        }, 1000);
      };
    };

    void syncGameFromServer();
    connectSocket();
    const pollTimer = window.setInterval(() => {
      if (!isActiveSocket) {
        return;
      }

      void syncGameFromServer();
    }, 1500);

    return () => {
      isMounted = false;
      isActiveSocket = false;
      setIsWsConnected(false);
      clearWsTimers();
      window.clearInterval(pollTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [navigate, applyGameUpdate]);

  React.useEffect(() => {
    if (!game || !playerSymbol) {
      return;
    }

    if (game.status === 'over') {
      const outcome: GameOutcome = game.isDraw ? 'draw' : game.winner === playerSymbol ? 'win' : 'lose';
      const navigateTimer = setTimeout(() => {
        navigate(`/result/${outcome}`);
      }, 600);

      return () => clearTimeout(navigateTimer);
    }

    return;
  }, [game, playerSymbol, navigate]);

  React.useEffect(() => {
    if (!game || game.status === 'over') {
      previousBoardRef.current = game?.board ?? null;
      return;
    }

    const previousBoard = previousBoardRef.current;
    previousBoardRef.current = game.board;

    if (!previousBoard) {
      return;
    }

    const piecePlaced = game.board.some(
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
  }, [game]);

  const handleMove = async (index: number) => {
    if (!game || !playerId || !playerSymbol || game.status !== 'active' || game.nextTurn !== playerSymbol || game.board[index] !== null) {
      return;
    }

    setError(null);
    setIsSubmittingMove(true);

    try {
      const nextGame = await makeMove(game.id, playerId, index);
      applyGameUpdate(nextGame);
    } catch (requestError) {
      const errorCode = requestError instanceof Error ? requestError.message : 'REQUEST_FAILED';
      setError(errorCode);
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const backToHome = async () => {
    if (game && playerId) {
      try {
        await leaveGame(game.id, playerId);
      } catch {
        // Best-effort leave notification; local navigation still proceeds.
      }
    }

    clearGameSession();
    navigate('/');
  };

  const copyGameId = async () => {
    if (!game) {
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(game.id);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = game.id;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopyMessage('Copied');
      window.setTimeout(() => setCopyMessage(null), 1200);
    } catch {
      setCopyMessage('Copy failed');
      window.setTimeout(() => setCopyMessage(null), 1200);
    }
  };

  const status = (() => {
    if (isLoading) {
      return 'Loading game...';
    }

    if (!game || !playerSymbol) {
      return 'Could not load game session.';
    }

    if (game.status === 'waiting') {
      return 'Waiting for opponent to join.';
    }

    if (game.status === 'over' && game.winner) {
      return game.winner === playerSymbol ? 'You win!' : 'You lose!';
    }

    if (game.status === 'over') {
      return 'Draw!';
    }

    if (game.nextTurn === playerSymbol) {
      return `Your turn (${playerSymbol})`;
    }

    return `Opponent's turn (${game.nextTurn})`;
  })();
  const board = game ? game.board : Array(9).fill(null);

  return (
    <main className="app">
      <h1>Tic-Tac-Toe</h1>
      <p className="status">{status}</p>
      {game ? (
        <div className="session-row">
          <p className="session-info">Game ID: {game.id}</p>
          <span
            className={`ws-indicator ${isWsConnected ? 'connected' : 'disconnected'}`}
            aria-label={isWsConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
            title={isWsConnected ? 'Realtime connected' : 'Realtime disconnected'}
          />
          <button
            className="copy-id-button"
            onClick={copyGameId}
            aria-label="Copy game ID"
            title="Copy game ID"
          >
            <i className="pi pi-copy" aria-hidden="true"></i>
          </button>
          {copyMessage ? <span className="copy-message">{copyMessage}</span> : null}
        </div>
      ) : null}
      {error ? <p className="error-message">Error: {error}</p> : null}

      <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((cell, index) => {
          const isClickable =
            game !== null &&
            game.status === 'active' &&
            game.board[index] === null &&
            game.nextTurn === playerSymbol &&
            !isSubmittingMove;

          return (
            <button
              key={index}
              className={`square${isClickable ? ' is-available' : ''}`}
              onClick={() => handleMove(index)}
              disabled={!isClickable}
              aria-label={`Square ${index + 1}`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div className="actions">
        <button className="reset secondary" onClick={() => void backToHome()}>
          Leave Game
        </button>
      </div>
    </main>
  );
}

export default GamePage;
