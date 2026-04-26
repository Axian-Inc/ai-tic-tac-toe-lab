import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMode } from "./game";
import { isCellDisabled } from "./game";
import { GameScreen } from "./components/GameScreen";
import { LandingScreen } from "./components/LandingScreen";
import { useGameSessionStore } from "./store/gameSession";

const MAX_PLAYER_NAME_LENGTH = 24;
const PLAYER_NAME_PATTERN = /^[A-Za-z0-9]+$/;

const getPlayerNameError = (value: string): string | null => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "Enter your name to start a game.";
  }

  if (!PLAYER_NAME_PATTERN.test(trimmedValue)) {
    return "Use letters and numbers only.";
  }

  return null;
};

function App() {
  const [landingSelectedMode, setLandingSelectedMode] = useState<GameMode>("player-vs-player");
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const game = useGameSessionStore((state) => state.game);
  const playerName = useGameSessionStore((state) => state.playerName);
  const selectedMode = useGameSessionStore((state) => state.selectedMode);
  const startGame = useGameSessionStore((state) => state.startGame);
  const playCell = useGameSessionStore((state) => state.playCell);
  const newGame = useGameSessionStore((state) => state.newGame);
  const changeMode = useGameSessionStore((state) => state.changeMode);
  const resetSession = useGameSessionStore((state) => state.resetSession);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousMoveCountRef = useRef(0);
  const previousFeedbackRef = useRef<"win" | "lose" | "none">("none");

  const primeAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextCtor = window.AudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    if (audioContextRef.current === null) {
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const playOscillatorBurst = useCallback((
    context: AudioContext,
    options: {
      frequency: number;
      duration: number;
      type: OscillatorType;
      volume: number;
      delay?: number;
      slideTo?: number;
    },
  ) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = context.currentTime + (options.delay ?? 0);
    const endAt = startAt + options.duration;

    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(options.frequency, startAt);
    if (options.slideTo !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, endAt);
    }

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(options.volume, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }, []);

  const playMoveSound = useCallback(() => {
    const context = primeAudio();

    if (context === null) {
      return;
    }

    playOscillatorBurst(context, {
      frequency: 170,
      slideTo: 120,
      duration: 0.14,
      type: "triangle",
      volume: 0.05,
    });
    playOscillatorBurst(context, {
      frequency: 240,
      slideTo: 180,
      duration: 0.1,
      type: "sine",
      volume: 0.03,
      delay: 0.01,
    });
  }, [playOscillatorBurst, primeAudio]);

  const playWinSound = useCallback(() => {
    const context = primeAudio();

    if (context === null) {
      return;
    }

    playOscillatorBurst(context, {
      frequency: 440,
      slideTo: 660,
      duration: 0.18,
      type: "triangle",
      volume: 0.05,
    });
    playOscillatorBurst(context, {
      frequency: 660,
      slideTo: 880,
      duration: 0.22,
      type: "triangle",
      volume: 0.05,
      delay: 0.08,
    });
    playOscillatorBurst(context, {
      frequency: 880,
      slideTo: 990,
      duration: 0.28,
      type: "sine",
      volume: 0.04,
      delay: 0.16,
    });
  }, [playOscillatorBurst, primeAudio]);

  const playLoseSound = useCallback(() => {
    const context = primeAudio();

    if (context === null) {
      return;
    }

    playOscillatorBurst(context, {
      frequency: 320,
      slideTo: 210,
      duration: 0.2,
      type: "sawtooth",
      volume: 0.035,
    });
    playOscillatorBurst(context, {
      frequency: 210,
      slideTo: 160,
      duration: 0.28,
      type: "triangle",
      volume: 0.03,
      delay: 0.1,
    });
  }, [playOscillatorBurst, primeAudio]);

  useEffect(() => {
    if (game === null) {
      previousMoveCountRef.current = 0;
      previousFeedbackRef.current = "none";
      setShowConfetti(false);
      return;
    }

    if (game.moveHistory.length > previousMoveCountRef.current) {
      playMoveSound();
    }
    previousMoveCountRef.current = game.moveHistory.length;

    const feedbackType: "win" | "lose" | "none" =
      game.state === "won"
        ? game.mode === "player-vs-cpu" && game.winner !== null && game.controllers[game.winner] === "cpu"
          ? "lose"
          : "win"
        : "none";

    if (feedbackType !== previousFeedbackRef.current) {
      if (feedbackType === "win") {
        playWinSound();
        setShowConfetti(true);
      } else if (feedbackType === "lose") {
        playLoseSound();
        setShowConfetti(false);
      } else {
        setShowConfetti(false);
      }
    }

    previousFeedbackRef.current = feedbackType;
  }, [game, playLoseSound, playMoveSound, playWinSound]);

  useEffect(() => {
    if (!showConfetti) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowConfetti(false);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [showConfetti]);

  const handleStartGame = () => {
    const trimmedName = playerNameInput.trim();
    const error = getPlayerNameError(trimmedName);

    if (error !== null) {
      setNameError(error);
      return;
    }

    primeAudio();
    setNameError(null);
    startGame(landingSelectedMode, trimmedName);
  };

  const handleLandingModeChange = (mode: GameMode) => {
    setLandingSelectedMode(mode);
  };

  const handleCellClick = (cellIndex: number) => {
    if (game === null || isCellDisabled(game, cellIndex)) {
      return;
    }

    primeAudio();
    playCell(cellIndex);
  };

  const handleNewGame = () => {
    primeAudio();
    newGame();
  };

  const handleQuit = () => {
    resetSession();
    setLandingSelectedMode("player-vs-player");
    setPlayerNameInput("");
    setNameError(null);
    setShowConfetti(false);
  };

  const handleModeChange = (mode: GameMode) => {
    if (game === null) {
      handleLandingModeChange(mode);
      return;
    }

    changeMode(mode);
  };

  if (game === null) {
    return (
      <LandingScreen
        maxPlayerNameLength={MAX_PLAYER_NAME_LENGTH}
        nameError={nameError}
        playerNameInput={playerNameInput}
        selectedMode={landingSelectedMode}
        onModeChange={handleLandingModeChange}
        onNameChange={(value) => {
          setPlayerNameInput(value);
          if (nameError !== null) {
            setNameError(null);
          }
        }}
        onStartGame={handleStartGame}
      />
    );
  }

  return (
    <GameScreen
      game={game}
      playerName={playerName}
      selectedMode={selectedMode}
      showConfetti={showConfetti}
      onCellClick={handleCellClick}
      onModeChange={handleModeChange}
      onNewGame={handleNewGame}
      onQuit={handleQuit}
    />
  );
}

export default App;
