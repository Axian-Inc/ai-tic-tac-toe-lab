import { useEffect, useState } from 'react';
import type { MultiplayerGameState, MultiplayerGameSummary } from '../../shared/contracts';
import { chooseDeterministicCpuMove, createEmptyGameState, applyMove, canPlayMove, type GameState } from '../features/game/model';
import {
  connectToGameEvents,
  createMultiplayerGame,
  joinMultiplayerGame,
  listWaitingGames,
  submitMultiplayerMove,
} from '../features/multiplayer/api';
import { getLocalPlayer, toRenderableGameState } from '../features/multiplayer/mappers';
import { GamePage } from '../pages/GamePage';
import { LandingPage } from '../pages/LandingPage';
import { MultiplayerGamePage } from '../pages/MultiplayerGamePage';
import { MultiplayerLobbyPage } from '../pages/MultiplayerLobbyPage';
import '../styles/app.css';

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'single-player' | 'multiplayer-lobby' | 'multiplayer-game'>(
    'landing',
  );
  const [singlePlayerGameState, setSinglePlayerGameState] = useState<GameState>(createEmptyGameState);
  const [waitingGameSummaries, setWaitingGameSummaries] = useState<readonly MultiplayerGameSummary[]>([]);
  const [multiplayerGame, setMultiplayerGame] = useState<MultiplayerGameState | null>(null);
  const [multiplayerSessionId, setMultiplayerSessionId] = useState<string | null>(null);
  const [multiplayerFeedback, setMultiplayerFeedback] = useState<string | null>(null);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [isMultiplayerBusy, setIsMultiplayerBusy] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (
      screen !== 'single-player' ||
      singlePlayerGameState.isGameOver ||
      singlePlayerGameState.currentPlayer !== 'O'
    ) {
      return;
    }

    const cpuMove = chooseDeterministicCpuMove(singlePlayerGameState, 'O');
    if (cpuMove === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSinglePlayerGameState((current) => {
        if (current.isGameOver || current.currentPlayer !== 'O' || !canPlayMove(current, cpuMove)) {
          return current;
        }

        return applyMove(current, cpuMove);
      });
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [singlePlayerGameState, screen]);

  useEffect(() => {
    if (screen !== 'multiplayer-lobby') {
      return;
    }

    void refreshWaitingGames();
  }, [screen]);

  useEffect(() => {
    if (screen !== 'multiplayer-game' || multiplayerGame === null) {
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('connecting');
    const disconnect = connectToGameEvents(
      multiplayerGame.id,
      (event) => {
        setMultiplayerGame(event.game);

        if (event.type === 'game.player.joined') {
          setMultiplayerFeedback('A second player joined the match.');
        } else if (event.type === 'game.move.accepted') {
          setMultiplayerFeedback(`Turn ${event.move.turn} accepted at cell ${event.move.position}.`);
        } else if (event.type === 'game.snapshot' && event.reason === 'resync') {
          setMultiplayerFeedback('Live match connection synchronized.');
        } else if (event.type === 'game.abandoned') {
          setMultiplayerFeedback('The server closed the match due to abandonment.');
        } else if (event.type === 'game.resigned') {
          setMultiplayerFeedback('The server closed the match due to resignation.');
        }

        setMultiplayerError(null);
      },
      (connected) => {
        setConnectionState(connected ? 'connected' : 'disconnected');
      },
    );

    return () => {
      disconnect();
    };
  }, [multiplayerGame?.id, screen]);

  function startSinglePlayerGame() {
    setSinglePlayerGameState(createEmptyGameState());
    setScreen('single-player');
  }

  function quitGame() {
    setScreen('landing');
  }

  function requestMove(position: number) {
    setSinglePlayerGameState((current) => (canPlayMove(current, position) ? applyMove(current, position) : current));
  }

  function rematch() {
    setSinglePlayerGameState(createEmptyGameState());
  }

  async function refreshWaitingGames() {
    try {
      const response = await listWaitingGames();
      setWaitingGameSummaries(response.games);
    } catch (error) {
      setMultiplayerError(error instanceof Error ? error.message : 'Unable to load waiting games.');
    }
  }

  async function openMultiplayerLobby() {
    setMultiplayerError(null);
    setMultiplayerFeedback(null);
    setScreen('multiplayer-lobby');
    await refreshWaitingGames();
  }

  async function handleCreateMultiplayerGame() {
    setIsMultiplayerBusy(true);
    setMultiplayerError(null);

    try {
      const response = await createMultiplayerGame();
      setMultiplayerGame(response.game);
      setMultiplayerSessionId(response.participant.sessionId);
      setMultiplayerFeedback('Multiplayer game created. Waiting for another player to join.');
      setScreen('multiplayer-game');
    } catch (error) {
      setMultiplayerError(error instanceof Error ? error.message : 'Unable to create multiplayer game.');
    } finally {
      setIsMultiplayerBusy(false);
    }
  }

  async function handleJoinMultiplayerGame(gameId: string) {
    setIsMultiplayerBusy(true);
    setMultiplayerError(null);

    try {
      const response = await joinMultiplayerGame(gameId);
      setMultiplayerGame(response.game);
      setMultiplayerSessionId(response.participant.sessionId);
      setMultiplayerFeedback('Joined multiplayer match. Live updates are active.');
      setScreen('multiplayer-game');
    } catch (error) {
      setMultiplayerError(error instanceof Error ? error.message : 'Unable to join multiplayer game.');
    } finally {
      setIsMultiplayerBusy(false);
    }
  }

  async function handleMultiplayerMove(position: number) {
    if (multiplayerGame === null || multiplayerSessionId === null) {
      return;
    }

    setIsMultiplayerBusy(true);
    setMultiplayerError(null);

    try {
      const response = await submitMultiplayerMove(
        multiplayerGame.id,
        multiplayerSessionId,
        position,
        multiplayerGame.moves.length + 1,
      );
      setMultiplayerGame(response.game);
    } catch (error) {
      setMultiplayerError(error instanceof Error ? error.message : 'Unable to submit move.');
    } finally {
      setIsMultiplayerBusy(false);
    }
  }

  function handleBackToLobby() {
    setMultiplayerGame(null);
    setMultiplayerSessionId(null);
    setMultiplayerFeedback(null);
    setConnectionState('disconnected');
    setScreen('multiplayer-lobby');
  }

  if (screen === 'landing') {
    return <LandingPage onMultiplayer={() => void openMultiplayerLobby()} onPlayCpu={startSinglePlayerGame} />;
  }

  if (screen === 'multiplayer-lobby') {
    return (
      <MultiplayerLobbyPage
        errorMessage={multiplayerError}
        isBusy={isMultiplayerBusy}
        onBack={quitGame}
        onCreate={() => void handleCreateMultiplayerGame()}
        onJoin={(gameId) => void handleJoinMultiplayerGame(gameId)}
        onRefresh={() => void refreshWaitingGames()}
        waitingGames={waitingGameSummaries}
      />
    );
  }

  if (screen === 'multiplayer-game' && multiplayerGame !== null && multiplayerSessionId !== null) {
    const localPlayer = getLocalPlayer(multiplayerGame, multiplayerSessionId);

    return (
      <MultiplayerGamePage
        connectionState={connectionState}
        feedbackMessage={multiplayerFeedback}
        game={multiplayerGame}
        isSubmittingMove={isMultiplayerBusy}
        localPlayer={localPlayer}
        onBackToLobby={handleBackToLobby}
        onSelectCell={(position) => void handleMultiplayerMove(position)}
        renderableGameState={toRenderableGameState(multiplayerGame)}
        requestError={multiplayerError}
      />
    );
  }

  return (
    <GamePage
      gameState={singlePlayerGameState}
      onQuit={quitGame}
      onRematch={rematch}
      onSelectCell={requestMove}
    />
  );
}
