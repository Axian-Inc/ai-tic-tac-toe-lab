import { useEffect, useState } from 'react';
import type { MultiplayerGameState, MultiplayerGameSummary } from '../../shared/contracts';
import { chooseDeterministicCpuMove, createEmptyGameState, applyMove, canPlayMove, type GameState } from '../features/game/model';
import {
  connectToGameEvents,
  createMultiplayerGame,
  getMultiplayerGame,
  joinMultiplayerGame,
  listActiveGames,
  listWaitingGames,
  submitMultiplayerMove,
} from '../features/multiplayer/api';
import { getLocalPlayer, toRenderableGameState } from '../features/multiplayer/mappers';
import { GamePage } from '../pages/GamePage';
import { LandingPage } from '../pages/LandingPage';
import { MultiplayerGamePage } from '../pages/MultiplayerGamePage';
import { MultiplayerLobbyPage } from '../pages/MultiplayerLobbyPage';
import { SpectatorLobbyPage } from '../pages/SpectatorLobbyPage';
import '../styles/app.css';

export default function App() {
  const [screen, setScreen] = useState<
    'landing' | 'single-player' | 'multiplayer-lobby' | 'multiplayer-game' | 'spectator-lobby' | 'spectator-game'
  >('landing');
  const [singlePlayerGameState, setSinglePlayerGameState] = useState<GameState>(createEmptyGameState);
  const [waitingGameSummaries, setWaitingGameSummaries] = useState<readonly MultiplayerGameSummary[]>([]);
  const [activeGameSummaries, setActiveGameSummaries] = useState<readonly MultiplayerGameSummary[]>([]);
  const [multiplayerGame, setMultiplayerGame] = useState<MultiplayerGameState | null>(null);
  const [multiplayerSessionId, setMultiplayerSessionId] = useState<string | null>(null);
  const [multiplayerFeedback, setMultiplayerFeedback] = useState<string | null>(null);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [isMultiplayerBusy, setIsMultiplayerBusy] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [spectatorGame, setSpectatorGame] = useState<MultiplayerGameState | null>(null);
  const [spectatorFeedback, setSpectatorFeedback] = useState<string | null>(null);
  const [spectatorError, setSpectatorError] = useState<string | null>(null);
  const [isSpectatorBusy, setIsSpectatorBusy] = useState(false);
  const [spectatorConnectionState, setSpectatorConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>(
    'disconnected',
  );

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
    if (screen !== 'spectator-lobby') {
      return;
    }

    void refreshActiveGames();
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

  useEffect(() => {
    if (screen !== 'spectator-game' || spectatorGame === null) {
      setSpectatorConnectionState('disconnected');
      return;
    }

    setSpectatorConnectionState('connecting');
    const disconnect = connectToGameEvents(
      spectatorGame.id,
      (event) => {
        setSpectatorGame(event.game);

        if (event.type === 'game.move.accepted') {
          setSpectatorFeedback(`Observed turn ${event.move.turn} at cell ${event.move.position}.`);
        } else if (event.type === 'game.player.joined') {
          setSpectatorFeedback('A second player joined this match.');
        } else if (event.type === 'game.snapshot' && event.reason === 'resync') {
          setSpectatorFeedback('Spectator view resynchronized with the server.');
        } else if (event.type === 'game.abandoned') {
          setSpectatorFeedback('The server ended this match due to abandonment.');
        } else if (event.type === 'game.resigned') {
          setSpectatorFeedback('The server ended this match due to resignation.');
        }

        setSpectatorError(null);
      },
      (connected) => {
        setSpectatorConnectionState(connected ? 'connected' : 'disconnected');
      },
    );

    return () => {
      disconnect();
    };
  }, [screen, spectatorGame?.id]);

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

  async function refreshActiveGames() {
    try {
      const response = await listActiveGames();
      setActiveGameSummaries(response.games);
    } catch (error) {
      setSpectatorError(error instanceof Error ? error.message : 'Unable to load active games.');
    }
  }

  async function openMultiplayerLobby() {
    setMultiplayerError(null);
    setMultiplayerFeedback(null);
    setScreen('multiplayer-lobby');
    await refreshWaitingGames();
  }

  async function openSpectatorLobby() {
    setSpectatorError(null);
    setSpectatorFeedback(null);
    setScreen('spectator-lobby');
    await refreshActiveGames();
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

  async function handleWatchGame(gameId: string) {
    setIsSpectatorBusy(true);
    setSpectatorError(null);

    try {
      const response = await getMultiplayerGame(gameId);
      setSpectatorGame(response.game);
      setSpectatorFeedback('Spectator view connected to the current server snapshot.');
      setScreen('spectator-game');
    } catch (error) {
      setSpectatorError(error instanceof Error ? error.message : 'Unable to load the selected game.');
    } finally {
      setIsSpectatorBusy(false);
    }
  }

  function handleBackToSpectatorLobby() {
    setSpectatorGame(null);
    setSpectatorFeedback(null);
    setSpectatorConnectionState('disconnected');
    setScreen('spectator-lobby');
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        onMultiplayer={() => void openMultiplayerLobby()}
        onPlayCpu={startSinglePlayerGame}
        onSpectate={() => void openSpectatorLobby()}
      />
    );
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

  if (screen === 'spectator-lobby') {
    return (
      <SpectatorLobbyPage
        activeGames={activeGameSummaries}
        errorMessage={spectatorError}
        isBusy={isSpectatorBusy}
        onBack={quitGame}
        onRefresh={() => void refreshActiveGames()}
        onWatch={(gameId) => void handleWatchGame(gameId)}
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

  if (screen === 'spectator-game' && spectatorGame !== null) {
    return (
      <MultiplayerGamePage
        backLabel="Back to Spectator Lobby"
        connectionState={spectatorConnectionState}
        eyebrow="Phase 3 · Spectator View"
        feedbackMessage={spectatorFeedback}
        game={spectatorGame}
        isSubmittingMove={false}
        lead={`Game ID ${spectatorGame.id}. This client is watching a live multiplayer match and cannot send moves.`}
        localPlayer={null}
        onBackToLobby={handleBackToSpectatorLobby}
        onSelectCell={() => {}}
        renderableGameState={toRenderableGameState(spectatorGame)}
        requestError={spectatorError}
        title="Live Spectator View"
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
