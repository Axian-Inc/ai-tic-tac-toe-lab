import type { GameMode } from "../game";
import type { PublicGameSummary, PublicPlayerSeat } from "../api/types";

export type OnlineStartAction = "create" | "join" | "spectate";

type LandingScreenProps = {
  gameIdError: string | null;
  gameIdInput: string;
  isOnlineBusy: boolean;
  maxPlayerNameLength: number;
  nameError: string | null;
  onlineAction: OnlineStartAction;
  onlineError: string | null;
  onlineGames: PublicGameSummary[];
  onlineGamesError: string | null;
  onlineGamesLoading: boolean;
  onlineSelectionBlocked: boolean;
  playerNameInput: string;
  selectedMode: GameMode;
  onGameIdChange: (value: string) => void;
  onModeChange: (mode: GameMode) => void;
  onNameChange: (value: string) => void;
  onOnlineActionChange: (action: OnlineStartAction) => void;
  onOnlineGameSelect: (gameId: string) => void;
  onOnlineGamesRefresh: () => void;
  onStartGame: () => void;
};

const formatPlayerList = (game: PublicGameSummary): string => {
  const players = Object.values(game.players).filter(
    (seat): seat is PublicPlayerSeat => seat !== undefined,
  );

  if (players.length === 0) {
    return "No players";
  }

  return players.map((player) => `${player.mark}: ${player.displayName}`).join(" vs ");
};

const formatUpdatedTime = (updatedAt: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(updatedAt));

export function LandingScreen({
  gameIdError,
  gameIdInput,
  isOnlineBusy,
  maxPlayerNameLength,
  nameError,
  onlineAction,
  onlineError,
  onlineGames,
  onlineGamesError,
  onlineGamesLoading,
  onlineSelectionBlocked,
  playerNameInput,
  selectedMode,
  onGameIdChange,
  onModeChange,
  onNameChange,
  onOnlineActionChange,
  onOnlineGameSelect,
  onOnlineGamesRefresh,
  onStartGame,
}: LandingScreenProps) {
  const characterCount = playerNameInput.trim().length;
  const requiresGameId = onlineAction !== "create";
  const selectedGameId = gameIdInput.trim();
  const selectedGame = onlineGames.find((game) => game.id === selectedGameId);
  const hasStaleSelection = requiresGameId && selectedGameId.length > 0 && selectedGame === undefined;
  const startButtonLabel =
    selectedMode === "online-multiplayer"
      ? onlineAction === "create"
        ? "Create game"
        : onlineAction === "join"
          ? "Join game"
          : "Spectate game"
      : "Start game";

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
            Choose a local match, a CPU round, or an online room.
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
          Letters, numbers, underscores, or hyphens. Maximum {maxPlayerNameLength} characters.
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
          <label className="mode-option">
            <input
              type="radio"
              name="landing-mode"
              value="online-multiplayer"
              checked={selectedMode === "online-multiplayer"}
              onChange={() => onModeChange("online-multiplayer")}
            />
            <span>Online Multiplayer</span>
          </label>
        </fieldset>

        {selectedMode === "online-multiplayer" ? (
          <div className="online-setup" data-testid="online-setup">
            <div className="online-action-tabs" role="group" aria-label="Online action">
              <button
                type="button"
                className="tab-button"
                aria-pressed={onlineAction === "create"}
                onClick={() => onOnlineActionChange("create")}
                data-testid="online-action-create"
              >
                Create
              </button>
              <button
                type="button"
                className="tab-button"
                aria-pressed={onlineAction === "join"}
                onClick={() => onOnlineActionChange("join")}
                data-testid="online-action-join"
              >
                Join
              </button>
              <button
                type="button"
                className="tab-button"
                aria-pressed={onlineAction === "spectate"}
                onClick={() => onOnlineActionChange("spectate")}
                data-testid="online-action-spectate"
              >
                Spectate
              </button>
            </div>

            {requiresGameId ? (
              <div className="online-game-list" data-testid="online-game-list">
                <div className="online-list-header">
                  <div>
                    <p className="status-label">In-progress games</p>
                    <p className="field-note">
                      Select a waiting game to join, or any listed game to spectate.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={onOnlineGamesRefresh}
                    disabled={onlineGamesLoading}
                    data-testid="refresh-online-games"
                  >
                    {onlineGamesLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {onlineGamesError ? (
                  <p className="field-error" data-testid="online-games-error">
                    {onlineGamesError}
                  </p>
                ) : null}

                {onlineGames.length === 0 && !onlineGamesLoading ? (
                  <p className="empty-online-games" data-testid="empty-online-games">
                    No in-progress games are available.
                  </p>
                ) : null}

                {onlineGames.length > 0 ? (
                  <div className="online-games-grid">
                    {onlineGames.map((game) => {
                      const isSelected = game.id === selectedGameId;
                      const joinBlocked = onlineAction === "join" && game.state === "active";
                      const buttonLabel = joinBlocked
                        ? "Playing"
                        : isSelected
                          ? "Selected"
                          : "Select";

                      return (
                        <button
                          type="button"
                          key={game.id}
                          className="online-game-option"
                          aria-pressed={isSelected}
                          disabled={joinBlocked}
                          onClick={() => onOnlineGameSelect(game.id)}
                          data-testid={`online-game-option-${game.id}`}
                        >
                          <span>
                            <strong>{game.id}</strong>
                            <small>{formatPlayerList(game)}</small>
                          </span>
                          <span>
                            <strong>{game.state === "waiting_for_players" ? "Waiting" : "Active"}</strong>
                            <small>
                              {game.moveCount} moves · updated {formatUpdatedTime(game.updatedAt)}
                            </small>
                          </span>
                          <span className="online-game-select-copy">{buttonLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            {requiresGameId ? (
              <label className="name-field">
                <span>Game id</span>
                <input
                  type="text"
                  value={gameIdInput}
                  onChange={(event) => onGameIdChange(event.target.value)}
                  inputMode="text"
                  autoComplete="off"
                  aria-describedby="game-id-guidance"
                  data-testid="game-id-input"
                />
              </label>
            ) : null}
            {requiresGameId ? (
              <p id="game-id-guidance" className="field-note">
                Select a game above or paste a game id from an online room.
              </p>
            ) : null}
            {hasStaleSelection ? (
              <p className="field-note" data-testid="stale-game-selection">
                This game is not in the current list; the server will verify it when you start.
              </p>
            ) : null}
            {onlineSelectionBlocked ? (
              <p className="field-error" data-testid="online-selection-blocked">
                Active games can only be spectated.
              </p>
            ) : null}
            {gameIdError ? (
              <p className="field-error" data-testid="game-id-error">
                {gameIdError}
              </p>
            ) : null}
            {onlineError ? (
              <p className="field-error" data-testid="online-error">
                {onlineError}
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className="primary-button landing-button"
          onClick={onStartGame}
          disabled={isOnlineBusy || onlineSelectionBlocked}
          data-testid="start-game"
        >
          {isOnlineBusy ? "Connecting..." : startButtonLabel}
        </button>
      </section>
    </main>
  );
}
