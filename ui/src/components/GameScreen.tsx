import type { Game, GameMode } from "../game";
import {
  getCurrentController,
  getHumanMark,
  getMatchupLabel,
  getStatus,
  getTerminalBanner,
  isCellDisabled,
} from "../game";

type GameScreenProps = {
  game: Game;
  playerName: string;
  selectedMode: GameMode;
  showConfetti: boolean;
  onCellClick: (cellIndex: number) => void;
  onModeChange: (mode: GameMode) => void;
  onNewGame: () => void;
  onQuit: () => void;
};

type StatusCardProps = {
  game: Game;
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onNewGame: () => void;
  onQuit: () => void;
};

type BoardCardProps = {
  game: Game;
  onCellClick: (cellIndex: number) => void;
  onNewGame: () => void;
};

function ConfettiBurst() {
  return (
    <div className="confetti-burst" data-testid="confetti">
      {Array.from({ length: 18 }, (_, index) => (
        <span key={index} className="confetti-piece" />
      ))}
    </div>
  );
}

function GameHero({ playerName, matchupLabel }: { playerName: string; matchupLabel: string }) {
  return (
    <section className="hero-panel">
      <p className="eyebrow">Rules-driven scaffold</p>
      <h1>Tic-Tac-Toe Lab</h1>
      <p className="matchup-copy" data-testid="matchup-label">
        {matchupLabel}
      </p>
      <p className="hero-copy">
        Welcome, <strong data-testid="player-name">{playerName}</strong>. The board is ready
        for a fresh round with explicit game states, move history, and Playwright coverage.
      </p>
    </section>
  );
}

function StatusCard({ game, selectedMode, onModeChange, onNewGame, onQuit }: StatusCardProps) {
  const currentController = getCurrentController(game);
  const status = getStatus(game);
  const humanMark = game.mode === "player-vs-cpu" ? getHumanMark(game) : null;

  return (
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
            onChange={(event) => onModeChange(event.target.value as GameMode)}
            data-testid="mode-select"
          >
            <option value="player-vs-player">Play vs Player</option>
            <option value="player-vs-cpu">Play vs CPU</option>
          </select>
        </label>
        <button type="button" className="primary-button" onClick={onNewGame}>
          New game
        </button>
        <button type="button" className="secondary-button" onClick={onQuit}>
          Quit game
        </button>
      </div>
    </div>
  );
}

function BoardCard({ game, onCellClick, onNewGame }: BoardCardProps) {
  const terminalBanner = getTerminalBanner(game);
  const canRematch = game.mode === "player-vs-cpu" && (game.state === "won" || game.state === "draw");
  const showTryAgain =
    game.mode === "player-vs-cpu" &&
    game.state === "won" &&
    game.winner !== null &&
    game.controllers[game.winner] === "cpu";

  return (
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
          onClick={onNewGame}
          data-testid="rematch-button"
        >
          Rematch
        </button>
      ) : null}
      <div className="board" role="grid" aria-label="Tic-tac-toe board">
        {game.board.map((cell, index) => {
          const disabled = isCellDisabled(game, index);
          const cellState = cell !== null ? "occupied" : disabled ? "locked" : "playable";

          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              className="cell"
              aria-label={`Cell ${index + 1}`}
              aria-disabled={disabled}
              data-testid={`cell-${index}`}
              data-mark={cell ?? "empty"}
              data-cell-state={cellState}
              onClick={() => onCellClick(index)}
              tabIndex={disabled ? -1 : 0}
            >
              {cell ?? ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoveHistory({ game }: { game: Game }) {
  return (
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
  );
}

export function GameScreen({
  game,
  playerName,
  selectedMode,
  showConfetti,
  onCellClick,
  onModeChange,
  onNewGame,
  onQuit,
}: GameScreenProps) {
  const matchupLabel = getMatchupLabel(playerName, game.mode);

  return (
    <main className="app-shell">
      {showConfetti ? <ConfettiBurst /> : null}
      <GameHero playerName={playerName} matchupLabel={matchupLabel} />

      <section className="game-layout">
        <StatusCard
          game={game}
          selectedMode={selectedMode}
          onModeChange={onModeChange}
          onNewGame={onNewGame}
          onQuit={onQuit}
        />
        <BoardCard game={game} onCellClick={onCellClick} onNewGame={onNewGame} />
        <MoveHistory game={game} />
      </section>
    </main>
  );
}
