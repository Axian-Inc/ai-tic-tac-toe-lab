import { useEffect, useState } from 'react';
import { chooseDeterministicCpuMove, createEmptyGameState, applyMove, canPlayMove, type GameState } from '../features/game/model';
import { GamePage } from '../pages/GamePage';
import { LandingPage } from '../pages/LandingPage';
import '../styles/app.css';

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'game'>('landing');
  const [gameState, setGameState] = useState<GameState>(createEmptyGameState);

  useEffect(() => {
    if (screen !== 'game' || gameState.isGameOver || gameState.currentPlayer !== 'O') {
      return;
    }

    const cpuMove = chooseDeterministicCpuMove(gameState, 'O');
    if (cpuMove === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setGameState((current) => {
        if (current.isGameOver || current.currentPlayer !== 'O' || !canPlayMove(current, cpuMove)) {
          return current;
        }

        return applyMove(current, cpuMove);
      });
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [gameState, screen]);

  function startSinglePlayerGame() {
    setGameState(createEmptyGameState());
    setScreen('game');
  }

  function quitGame() {
    setScreen('landing');
  }

  function requestMove(position: number) {
    setGameState((current) => (canPlayMove(current, position) ? applyMove(current, position) : current));
  }

  function rematch() {
    setGameState(createEmptyGameState());
  }

  if (screen === 'landing') {
    return <LandingPage onPlayCpu={startSinglePlayerGame} />;
  }

  return (
    <GamePage
      gameState={gameState}
      onQuit={quitGame}
      onRematch={rematch}
      onSelectCell={requestMove}
    />
  );
}
