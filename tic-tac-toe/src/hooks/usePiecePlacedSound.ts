import React from 'react';

type Board = Array<string | null>;

export function usePiecePlacedSound(board: Board | null, isEnabled = true) {
  const previousBoardRef = React.useRef<Board | null>(null);

  React.useEffect(() => {
    if (!isEnabled) {
      previousBoardRef.current = board;
      return;
    }

    if (!board) {
      previousBoardRef.current = null;
      return;
    }

    const previousBoard = previousBoardRef.current;
    previousBoardRef.current = board;

    if (!previousBoard) {
      return;
    }

    const piecePlaced = board.some(
      (cell, index) => cell !== null && previousBoard[index] === null
    );

    if (!piecePlaced) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

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
  }, [board, isEnabled]);
}
