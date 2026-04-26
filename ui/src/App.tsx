import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMode } from "./game";
import {
  getCurrentController,
  getHumanMark,
  getMatchupLabel,
  getStatus,
  getTerminalBanner,
  isCellDisabled,
} from "./game";
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
    const characterCount = playerNameInput.trim().length;

    return (
      <main className="app-shell landing-shell">
        <section className="hero-panel landing-hero">
          <p className="eyebrow">Welcome</p>
          <h1>Tic-Tac-Toe Lab</h1>
          <p className="hero-copy" data-testid="landing-copy">
            Enter your name, pick a match style, and launch a fresh game.
          </p>
        </section>

        <section className="landing-card">
          <div className="landing-copy-block">
            <p className="status-label">Player setup</p>
            <h2 data-testid="landing-heading">Start a new game</h2>
            <p>
              Choose player vs player for a local match, or player vs CPU for a
              solo round against the game.
            </p>
          </div>

          <label className="name-field">
            <span>Your name</span>
            <input
              type="text"
              value={playerNameInput}
              onChange={(event) => {
                setPlayerNameInput(event.target.value);
                if (nameError !== null) {
                  setNameError(null);
                }
              }}
              maxLength={MAX_PLAYER_NAME_LENGTH}
              inputMode="text"
              autoComplete="nickname"
              aria-describedby="name-guidance name-counter"
              data-testid="name-input"
            />
          </label>
          <p id="name-guidance" className="field-note">
            Letters and numbers only. Maximum {MAX_PLAYER_NAME_LENGTH} characters.
          </p>
          <p id="name-counter" className="field-note" data-testid="name-counter">
            {characterCount}/{MAX_PLAYER_NAME_LENGTH}
          </p>
          {nameError ? (
            <p className="field-error" data-testid="name-error">
              {nameError}
            </p>
          ) : null}

          <fieldset className="mode-fieldset">
            <legend>Game mode</legend>
            <label className="mode-option">
              <input
                type="radio"
                name="landing-mode"
                value="player-vs-player"
                checked={landingSelectedMode === "player-vs-player"}
                onChange={() => handleLandingModeChange("player-vs-player")}
              />
              <span>Player vs Player</span>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="landing-mode"
                value="player-vs-cpu"
                checked={landingSelectedMode === "player-vs-cpu"}
                onChange={() => handleLandingModeChange("player-vs-cpu")}
              />
              <span>Player vs CPU</span>
            </label>
          </fieldset>

          <button
            type="button"
            className="primary-button landing-button"
            onClick={handleStartGame}
            data-testid="start-game"
          >
            Start game
          </button>
        </section>
      </main>
    );
  }

  const currentController = getCurrentController(game);
  const status = getStatus(game);
  const terminalBanner = getTerminalBanner(game);
  const humanMark = game.mode === "player-vs-cpu" ? getHumanMark(game) : null;
  const matchupLabel = getMatchupLabel(playerName, game.mode);
  const canRematch = game.mode === "player-vs-cpu" && (game.state === "won" || game.state === "draw");
  const showTryAgain =
    game.mode === "player-vs-cpu" &&
    game.state === "won" &&
    game.winner !== null &&
    game.controllers[game.winner] === "cpu";

  return (
    <main className="app-shell">
      {showConfetti ? (
        <div className="confetti-burst" data-testid="confetti">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} className="confetti-piece" />
          ))}
        </div>
      ) : null}
      <section className="hero-panel">
        <p className="eyebrow">Rules-driven scaffold</p>
        <h1>Tic-Tac-Toe Lab</h1>
        <p className="matchup-copy" data-testid="matchup-label">
          {matchupLabel}
        </p>
        <p className="hero-copy">
          Welcome, <strong data-testid="player-name">{playerName}</strong>. The
          board is ready for a fresh round with explicit game states, move
          history, and Playwright coverage.
        </p>
      </section>

      <section className="game-layout">
        <div className="status-card" aria-live="polite">
          <p className="status-label">Game state</p>
          <h2 data-testid="status-heading">{status.heading}</h2>
          <p data-testid="status-body">{status.body}</p>
          {game.mode === "player-vs-cpu" ? (
            <p className="mode-copy" data-testid="player-role">
              You are playing as <strong>{humanMark}</strong>. The CPU is{" "}
              <strong>{humanMark === "X" ? "O" : "X"}</strong>.
            </p>
          ) : (
            <p className="mode-copy" data-testid="player-role">
              Two local players share the board.
            </p>
          )}
          <dl className="status-grid">
            <div>
              <dt>State</dt>
              <dd data-testid="game-state">{game.state}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd data-testid="game-mode">{game.mode}</dd>
            </div>
            <div>
              <dt>Current player</dt>
              <dd data-testid="current-player">{game.currentPlayer}</dd>
            </div>
            <div>
              <dt>Controller</dt>
              <dd data-testid="current-controller">{currentController}</dd>
            </div>
            <div>
              <dt>Winner</dt>
              <dd data-testid="winner">{game.winner ?? "None"}</dd>
            </div>
            <div>
              <dt>Moves</dt>
              <dd data-testid="move-count">{game.moveHistory.length}</dd>
            </div>
          </dl>

          <div className="controls">
            <label className="mode-picker">
              <span>Mode</span>
              <select
                value={selectedMode}
                onChange={(event) => handleModeChange(event.target.value as GameMode)}
                data-testid="mode-select"
              >
                <option value="player-vs-player">Play vs Player</option>
                <option value="player-vs-cpu">Play vs CPU</option>
              </select>
            </label>
            <button type="button" className="primary-button" onClick={handleNewGame}>
              New game
            </button>
            <button type="button" className="secondary-button" onClick={handleQuit}>
              Quit game
            </button>
          </div>
        </div>

        <div className="board-card">
          {terminalBanner ? (
            <div className="result-banner" data-testid="result-banner">
              {terminalBanner}
            </div>
          ) : null}
          {showTryAgain ? (
            <p className="loss-feedback" data-testid="loss-feedback">
              Try again. The CPU took this round.
            </p>
          ) : null}
          {canRematch ? (
            <button
              type="button"
              className="primary-button rematch-button"
              onClick={handleNewGame}
              data-testid="rematch-button"
            >
              Rematch
            </button>
          ) : null}
          <div className="board" role="grid" aria-label="Tic-tac-toe board">
            {game.board.map((cell, index) => (
              <button
                key={index}
                type="button"
                role="gridcell"
                className="cell"
                aria-label={`Cell ${index + 1}`}
                aria-disabled={isCellDisabled(game, index)}
                data-testid={`cell-${index}`}
                data-mark={cell ?? "empty"}
                data-cell-state={
                  cell !== null ? "occupied" : isCellDisabled(game, index) ? "locked" : "playable"
                }
                onClick={() => handleCellClick(index)}
                tabIndex={isCellDisabled(game, index) ? -1 : 0}
              >
                {cell ?? ""}
              </button>
            ))}
          </div>
        </div>

        <aside className="history-card">
          <div className="history-header">
            <h2>Move history</h2>
            <p>Tracked for the current in-memory game only.</p>
          </div>
          {game.moveHistory.length === 0 ? (
            <p className="empty-history" data-testid="empty-history">
              No moves recorded yet.
            </p>
          ) : (
            <ol className="history-list" data-testid="move-history">
              {game.moveHistory.map((move) => (
                <li key={move.moveNumber}>
                  <span>#{move.moveNumber}</span>
                  <span>{move.playerMark}</span>
                  <span>Cell {move.cellIndex + 1}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;
