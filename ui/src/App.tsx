import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMode } from "./game";
import { isCellDisabled as isLocalCellDisabled } from "./game";
import { listGames as listOnlineGames } from "./api/client";
import type { PublicGameSummary } from "./api/types";
import { GameScreen } from "./components/GameScreen";
import { LandingScreen, type OnlineStartAction } from "./components/LandingScreen";
import { useGameSessionStore } from "./store/gameSession";
import {
  getGameIdError,
  getPlayerNameError,
  MAX_PLAYER_NAME_LENGTH,
} from "./validation";

const onlineErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Online multiplayer request failed.";

function App() {
  const [landingSelectedMode, setLandingSelectedMode] = useState<GameMode>("player-vs-player");
  const [onlineAction, setOnlineAction] = useState<OnlineStartAction>("create");
  const [gameIdInput, setGameIdInput] = useState("");
  const [gameIdError, setGameIdError] = useState<string | null>(null);
  const [onlineGames, setOnlineGames] = useState<PublicGameSummary[]>([]);
  const [onlineGamesError, setOnlineGamesError] = useState<string | null>(null);
  const [onlineGamesLoading, setOnlineGamesLoading] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isStartingOnline, setIsStartingOnline] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const game = useGameSessionStore((state) => state.game);
  const onlineSession = useGameSessionStore((state) => state.onlineSession);
  const playerName = useGameSessionStore((state) => state.playerName);
  const selectedMode = useGameSessionStore((state) => state.selectedMode);
  const startGame = useGameSessionStore((state) => state.startGame);
  const playCell = useGameSessionStore((state) => state.playCell);
  const newGame = useGameSessionStore((state) => state.newGame);
  const changeMode = useGameSessionStore((state) => state.changeMode);
  const resetSession = useGameSessionStore((state) => state.resetSession);
  const createOnlineGame = useGameSessionStore((state) => state.createOnlineGame);
  const joinOnlineGame = useGameSessionStore((state) => state.joinOnlineGame);
  const spectateOnlineGame = useGameSessionStore((state) => state.spectateOnlineGame);
  const playOnlineCell = useGameSessionStore((state) => state.playOnlineCell);
  const resignOnlineGame = useGameSessionStore((state) => state.resignOnlineGame);
  const disconnectOnlineGame = useGameSessionStore((state) => state.disconnectOnlineGame);
  const recoverOnlineSession = useGameSessionStore((state) => state.recoverOnlineSession);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousMoveCountRef = useRef(0);
  const previousFeedbackRef = useRef<"win" | "lose" | "none">("none");

  useEffect(() => {
    void recoverOnlineSession();
  }, [recoverOnlineSession]);

  const refreshOnlineGames = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setOnlineGamesLoading(true);
    }

    try {
      const response = await listOnlineGames();
      setOnlineGames(response.games);
      setOnlineGamesError(null);
    } catch (error) {
      setOnlineGamesError(onlineErrorMessage(error));
    } finally {
      if (!options?.silent) {
        setOnlineGamesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (landingSelectedMode !== "online-multiplayer" || game !== null) {
      return undefined;
    }

    void refreshOnlineGames();
    const intervalId = window.setInterval(() => {
      void refreshOnlineGames({ silent: true });
    }, 5_000);

    return () => window.clearInterval(intervalId);
  }, [game, landingSelectedMode, refreshOnlineGames]);

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

  const handleStartGame = async () => {
    const trimmedName = playerNameInput.trim();
    const error = getPlayerNameError(trimmedName);

    if (error !== null) {
      setNameError(error);
      return;
    }

    if (landingSelectedMode === "online-multiplayer") {
      const trimmedGameId = gameIdInput.trim();
      const selectedGame = onlineGames.find((candidate) => candidate.id === trimmedGameId);
      const nextGameIdError = onlineAction === "create" ? null : getGameIdError(trimmedGameId);

      if (nextGameIdError !== null) {
        setGameIdError(nextGameIdError);
        return;
      }

      if (onlineAction === "join" && selectedGame?.state === "active") {
        setGameIdError("Active games can only be spectated.");
        return;
      }

      primeAudio();
      setNameError(null);
      setGameIdError(null);
      setIsStartingOnline(true);

      try {
        if (onlineAction === "create") {
          await createOnlineGame(trimmedName);
        } else if (onlineAction === "join") {
          await joinOnlineGame(trimmedGameId, trimmedName);
        } else {
          await spectateOnlineGame(trimmedGameId, trimmedName);
        }
      } finally {
        setIsStartingOnline(false);
      }

      return;
    }

    primeAudio();
    setNameError(null);
    startGame(landingSelectedMode, trimmedName);
  };

  const handleLandingModeChange = (mode: GameMode) => {
    setLandingSelectedMode(mode);
    setGameIdError(null);
    setNameError(null);
  };

  const handleOnlineGameSelect = (gameId: string) => {
    setGameIdInput(gameId);
    setGameIdError(null);
  };

  const isOnlineCellDisabled = (cellIndex: number): boolean =>
    game === null ||
    game.mode !== "online-multiplayer" ||
    game.state !== "active" ||
    onlineSession.role !== "player" ||
    onlineSession.playerMark === null ||
    onlineSession.playerToken === null ||
    game.currentPlayer !== onlineSession.playerMark ||
    game.board[cellIndex] !== null;

  const handleCellClick = (cellIndex: number) => {
    if (game === null) {
      return;
    }

    if (game.mode === "online-multiplayer") {
      if (isOnlineCellDisabled(cellIndex)) {
        return;
      }

      primeAudio();
      void playOnlineCell(cellIndex);
      return;
    }

    if (isLocalCellDisabled(game, cellIndex)) {
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
    if (game?.mode === "online-multiplayer") {
      disconnectOnlineGame();
    } else {
      resetSession();
    }

    setLandingSelectedMode("player-vs-player");
    setOnlineAction("create");
    setGameIdInput("");
    setGameIdError(null);
    setOnlineGamesError(null);
    setPlayerNameInput("");
    setNameError(null);
    setShowConfetti(false);
  };

  const handleCreateNewOnlineGame = () => {
    const displayName = playerName.trim();
    if (getPlayerNameError(displayName) !== null) {
      return;
    }

    primeAudio();
    void createOnlineGame(displayName);
  };

  const handleResignOnlineGame = () => {
    primeAudio();
    void resignOnlineGame();
  };

  const handleModeChange = (mode: GameMode) => {
    if (game === null) {
      handleLandingModeChange(mode);
      return;
    }

    changeMode(mode);
  };

  if (game === null) {
    const selectedOnlineGame = onlineGames.find((candidate) => candidate.id === gameIdInput.trim());
    const onlineSelectionBlocked =
      landingSelectedMode === "online-multiplayer" &&
      onlineAction === "join" &&
      selectedOnlineGame?.state === "active";

    return (
      <LandingScreen
        gameIdError={gameIdError}
        gameIdInput={gameIdInput}
        isOnlineBusy={isStartingOnline}
        maxPlayerNameLength={MAX_PLAYER_NAME_LENGTH}
        nameError={nameError}
        onlineAction={onlineAction}
        onlineError={onlineSession.error}
        onlineGames={onlineGames}
        onlineGamesError={onlineGamesError}
        onlineGamesLoading={onlineGamesLoading}
        onlineSelectionBlocked={onlineSelectionBlocked}
        playerNameInput={playerNameInput}
        selectedMode={landingSelectedMode}
        onGameIdChange={(value) => {
          setGameIdInput(value);
          if (gameIdError !== null) {
            setGameIdError(null);
          }
        }}
        onModeChange={handleLandingModeChange}
        onNameChange={(value) => {
          setPlayerNameInput(value);
          if (nameError !== null) {
            setNameError(null);
          }
        }}
        onOnlineActionChange={(action) => {
          setOnlineAction(action);
          setGameIdError(null);
        }}
        onOnlineGameSelect={handleOnlineGameSelect}
        onOnlineGamesRefresh={() => {
          void refreshOnlineGames();
        }}
        onStartGame={handleStartGame}
      />
    );
  }

  return (
    <GameScreen
      game={game}
      isCellDisabled={(cellIndex) =>
        game.mode === "online-multiplayer"
          ? isOnlineCellDisabled(cellIndex)
          : isLocalCellDisabled(game, cellIndex)
      }
      onlineSession={onlineSession}
      playerName={playerName}
      selectedMode={selectedMode}
      showConfetti={showConfetti}
      onCellClick={handleCellClick}
      onCreateOnlineGame={handleCreateNewOnlineGame}
      onModeChange={handleModeChange}
      onNewGame={handleNewGame}
      onQuit={handleQuit}
      onResign={handleResignOnlineGame}
    />
  );
}

export default App;
