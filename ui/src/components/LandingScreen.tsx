import type { GameMode } from "../game";

type LandingScreenProps = {
  maxPlayerNameLength: number;
  nameError: string | null;
  playerNameInput: string;
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onNameChange: (value: string) => void;
  onStartGame: () => void;
};

export function LandingScreen({
  maxPlayerNameLength,
  nameError,
  playerNameInput,
  selectedMode,
  onModeChange,
  onNameChange,
  onStartGame,
}: LandingScreenProps) {
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
            Choose player vs player for a local match, or player vs CPU for a solo
            round against the game.
          </p>
        </div>

        <label className="name-field">
          <span>Your name</span>
          <input
            type="text"
            value={playerNameInput}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={maxPlayerNameLength}
            inputMode="text"
            autoComplete="nickname"
            aria-describedby="name-guidance name-counter"
            data-testid="name-input"
          />
        </label>
        <p id="name-guidance" className="field-note">
          Letters and numbers only. Maximum {maxPlayerNameLength} characters.
        </p>
        <p id="name-counter" className="field-note" data-testid="name-counter">
          {characterCount}/{maxPlayerNameLength}
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
              checked={selectedMode === "player-vs-player"}
              onChange={() => onModeChange("player-vs-player")}
            />
            <span>Player vs Player</span>
          </label>
          <label className="mode-option">
            <input
              type="radio"
              name="landing-mode"
              value="player-vs-cpu"
              checked={selectedMode === "player-vs-cpu"}
              onChange={() => onModeChange("player-vs-cpu")}
            />
            <span>Player vs CPU</span>
          </label>
        </fieldset>

        <button
          type="button"
          className="primary-button landing-button"
          onClick={onStartGame}
          data-testid="start-game"
        >
          Start game
        </button>
      </section>
    </main>
  );
}
