import React, { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectGameMode } from '../features/app/appSlice';
import { clearGameSession } from '../features/game/session';

type GameOutcome = 'win' | 'lose' | 'draw';

const messageByOutcome: Record<GameOutcome, string> = {
  win: 'You win!',
  lose: 'You lose!',
  draw: 'Draw!',
};

function ResultPage() {
  const navigate = useNavigate();
  const { outcome } = useParams<{ outcome: string }>();
  const showConfetti = outcome === 'win';
  const showSadRain = outcome === 'lose';
  const gameMode = useAppSelector(selectGameMode);
  const confettiPieces = Array.from({ length: 36 }, (_, index) => {
    const left = (index * 7 + 13) % 100;
    const delay = (index % 12) * 0.12;
    const duration = 2.6 + (index % 8) * 0.2;
    const rotation = (index * 29) % 360;
    const colors = ['#f97316', '#facc15', '#22c55e', '#38bdf8', '#ec4899'];
    const color = colors[index % colors.length];

    return (
      <span
        key={`confetti-${index}`}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          transform: `rotate(${rotation}deg)`,
          background: color,
        }}
      />
    );
  });
  const sadDrops = Array.from({ length: 20 }, (_, index) => {
    const left = (index * 11 + 7) % 100;
    const delay = (index % 10) * 0.18;
    const duration = 3.1 + (index % 6) * 0.25;
    const size = 18 + (index % 4) * 4;

    return (
      <span
        key={`sad-drop-${index}`}
        className="emoji-drop"
        style={{
          left: `${left}%`,
          fontSize: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      >
        😢
      </span>
    );
  });

  useEffect(() => {
    const isValidOutcome = !!outcome && outcome in messageByOutcome;
    if (!isValidOutcome || !showConfetti) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    const notes = [
      { freq: 523.25, start: 0.0, duration: 0.2 },
      { freq: 659.25, start: 0.07, duration: 0.22 },
      { freq: 783.99, start: 0.14, duration: 0.28 },
      { freq: 1046.5, start: 0.2, duration: 0.35 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(1, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });

    return () => {
      audioContext.close().catch(() => undefined);
    };
  }, [showConfetti, outcome]);

  useEffect(() => {
    const isValidOutcome = !!outcome && outcome in messageByOutcome;
    if (!isValidOutcome || !showSadRain) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.16;
    masterGain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    const beatDuration = 0.4;
    const longDuration = 1.2;
    const notes = [
      { freq: 392.0, start: 0 * beatDuration, duration: beatDuration },
      { freq: 349.0, start: 1 * beatDuration, duration: beatDuration },
      { freq: 311.0, start: 2 * beatDuration, duration: beatDuration },
      { freq: 293.0, start: 3 * beatDuration, duration: longDuration },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.7, now + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });

    return () => {
      audioContext.close().catch(() => undefined);
    };
  }, [showSadRain, outcome]);

  if (!outcome || !(outcome in messageByOutcome)) {
    return <Navigate to="/" replace />;
  }

  const outcomeMessage = messageByOutcome[outcome as GameOutcome];
  return (
    <main className="app">
      {showConfetti ? (
        <div className="confetti" aria-hidden="true">
          {confettiPieces}
        </div>
      ) : null}
      {showSadRain ? (
        <div className="emoji-rain" aria-hidden="true">
          {sadDrops}
        </div>
      ) : null}
      <section className="landing result-card">
        <p className="mode-message result-message">{outcomeMessage}</p>
        <div className="actions result-actions">
          <button
            className="start"
            onClick={() => {
              clearGameSession();
              navigate(gameMode === 'single' ? '/single' : '/');
            }}
          >
            Play Again
          </button>
          <button
            className="reset secondary"
            onClick={() => {
              clearGameSession();
              navigate('/');
            }}
          >
            Home
          </button>
        </div>
      </section>
    </main>
  );
}

export default ResultPage;
