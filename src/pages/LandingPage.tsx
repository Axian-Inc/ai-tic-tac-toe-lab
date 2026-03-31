interface LandingPageProps {
  readonly onPlayCpu: () => void;
  readonly onMultiplayer: () => void;
  readonly onSpectate: () => void;
}

export function LandingPage({ onPlayCpu, onMultiplayer, onSpectate }: LandingPageProps) {
  return (
    <main className="app-shell app-shell--centered">
      <section className="hero-card hero-card--landing">
        <p className="eyebrow">Phase 3 · Story 3.2</p>
        <h1>Tic Tac Toe for players and live spectators.</h1>
        <p className="lead">
          Start a local game against the deterministic CPU, enter the multiplayer lobby
          to create or join server-backed matches, or open the spectator lobby to watch
          active games update in real time.
        </p>
        <div className="status-row">
          <span className="status-pill">Single Player</span>
          <span className="status-pill">Deterministic CPU</span>
          <span className="status-pill">Multiplayer Lobby</span>
          <span className="status-pill">Live Updates</span>
          <span className="status-pill">Spectator View</span>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onPlayCpu} type="button">
            Play vs. CPU
          </button>
          <button className="secondary-button" onClick={onMultiplayer} type="button">
            Multiplayer Lobby
          </button>
          <button className="secondary-button" onClick={onSpectate} type="button">
            Spectate Live Games
          </button>
        </div>
      </section>
    </main>
  );
}
