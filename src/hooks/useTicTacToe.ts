import { useEffect, useRef, useState } from 'react';
import { chooseCpuMove } from '../game/cpu';
import { applyMove, createInitialGameState } from '../game/gameEngine';
import type { GameState, Player } from '../game/types';

const CPU_MOVE_DELAY_MS = 480;
const MOVE_SOUND_DURATION_SECONDS = 0.11;
const MOVE_SOUND_VOLUME = 0.05;

function createAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor = globalThis.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }

  try {
    return new AudioContextConstructor();
  } catch {
    return null;
  }
}

function playMoveSound(player: Player) {
  const audioContext = createAudioContext();
  if (!audioContext) {
    return;
  }

  try {
    const oscillator = audioContext.createOscillator();
    const subOscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime;
    const endTime = startTime + MOVE_SOUND_DURATION_SECONDS;

    oscillator.type = 'triangle';
    subOscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(player === 'X' ? 220 : 180, startTime);
    subOscillator.frequency.setValueAtTime(player === 'X' ? 110 : 90, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(MOVE_SOUND_VOLUME, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    subOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startTime);
    subOscillator.start(startTime);
    oscillator.stop(endTime);
    subOscillator.stop(endTime);
    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {
    // Ignore audio failures so gameplay remains unaffected in browsers and tests.
  }
}

function playResultSound(result: 'win' | 'loss') {
  const audioContext = createAudioContext();
  if (!audioContext) {
    return;
  }

  const sequence =
    result === 'win'
      ? [
          { frequency: 523.25, duration: 0.12, type: 'triangle' as OscillatorType },
          { frequency: 659.25, duration: 0.14, type: 'triangle' as OscillatorType },
          { frequency: 783.99, duration: 0.22, type: 'sine' as OscillatorType },
        ]
      : [
          { frequency: 329.63, duration: 0.13, type: 'sawtooth' as OscillatorType },
          { frequency: 246.94, duration: 0.15, type: 'sawtooth' as OscillatorType },
          { frequency: 196, duration: 0.22, type: 'triangle' as OscillatorType },
        ];

  try {
    let cursor = audioContext.currentTime;

    for (const note of sequence) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, cursor);
      gainNode.gain.setValueAtTime(0.0001, cursor);
      gainNode.gain.exponentialRampToValueAtTime(0.05, cursor + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, cursor + note.duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(cursor);
      oscillator.stop(cursor + note.duration);
      cursor += note.duration * 0.88;
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 750);
  } catch {
    void audioContext.close();
  }
}

function getCpuMove(currentState: GameState): number | null {
  const cpuMove = chooseCpuMove(currentState);
  return cpuMove ? cpuMove.position : null;
}

export function useTicTacToe(mode: 'local' | 'cpu' = 'cpu') {
  const [gameState, setGameState] = useState(createInitialGameState);
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);
  const previousMoveCountRef = useRef(0);
  const previousOutcomeRef = useRef<'pending' | 'win' | 'loss' | 'draw'>('pending');
  const isCpuGame = mode === 'cpu';

  useEffect(() => {
    const moveCount = gameState.moveHistory.length;

    if (moveCount > previousMoveCountRef.current) {
      const lastMove = gameState.moveHistory[moveCount - 1];
      if (lastMove) {
        playMoveSound(lastMove.player);
      }
    }

    previousMoveCountRef.current = moveCount;
  }, [gameState.moveHistory]);

  useEffect(() => {
    const currentOutcome =
      gameState.winner === 'X'
        ? 'win'
        : gameState.winner === 'O'
          ? 'loss'
          : gameState.status === 'draw'
            ? 'draw'
            : 'pending';

    // Fire end-of-game effects only when the outcome changes, not on ordinary rerenders.
    if (currentOutcome !== previousOutcomeRef.current) {
      if (currentOutcome === 'win') {
        playResultSound('win');
        setConfettiBurst((currentBurst) => currentBurst + 1);
      } else if (currentOutcome === 'loss') {
        playResultSound('loss');
      }
    }

    previousOutcomeRef.current = currentOutcome;
  }, [gameState.status, gameState.winner]);

  useEffect(() => {
    if (!isCpuGame || gameState.isGameOver || gameState.currentPlayer !== 'O') {
      setIsCpuThinking(false);
      return undefined;
    }

    setIsCpuThinking(true);

    const timeoutId = window.setTimeout(() => {
      setGameState((currentState) => {
        const cpuPosition = getCpuMove(currentState);

        if (cpuPosition === null) {
          return currentState;
        }

        // Re-read state inside the timer so delayed CPU turns use the latest board snapshot.
        return applyMove(currentState, cpuPosition);
      });
      setIsCpuThinking(false);
    }, CPU_MOVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [gameState.currentPlayer, gameState.isGameOver, isCpuGame]);

  function playTurn(index: number) {
    if (isCpuThinking) {
      return;
    }

    setGameState((currentState) => {
      if (isCpuGame && currentState.currentPlayer !== 'X') {
        return currentState;
      }

      return applyMove(currentState, index);
    });
  }

  function resetGame() {
    setGameState(createInitialGameState());
    setIsCpuThinking(false);
    setConfettiBurst(0);
    previousMoveCountRef.current = 0;
    previousOutcomeRef.current = 'pending';
  }

  return {
    confettiBurst,
    gameState,
    isCpuThinking,
    playTurn,
    resetGame,
  };
}
