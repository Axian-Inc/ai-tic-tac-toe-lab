interface LandingPageProps {
  readonly onPlayCpu: () => void;
  readonly onMultiplayer: () => void;
}

export function LandingPage({ onPlayCpu, onMultiplayer }: LandingPageProps) {
  return (
    <main className="app-shell app-shell--centered">
      <section className="hero-card hero-card--landing">
        <p className="eyebrow">Phase 2 · Story 2.4</p>
        <h1>Tic Tac Toe, ready for local or live multiplayer play.</h1>
        <p className="lead">
          Start a local game against the deterministic CPU or enter the multiplayer lobby
          to create and join server-backed matches with live updates.
        </p>
        <div className="status-row">
          <span className="status-pill">Single Player</span>
          <span className="status-pill">Deterministic CPU</span>
          <span className="status-pill">Multiplayer Lobby</span>
          <span className="status-pill">Live Updates</span>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onPlayCpu} type="button">
            Play vs. CPU
          </button>
          <button className="secondary-button" onClick={onMultiplayer} type="button">
            Multiplayer Lobby
          </button>
        </div>
      </section>
    </main>
  );
}
