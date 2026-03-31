interface LandingPageProps {
  readonly onPlayCpu: () => void;
}

export function LandingPage({ onPlayCpu }: LandingPageProps) {
  return (
    <main className="app-shell app-shell--centered">
      <section className="hero-card hero-card--landing">
        <p className="eyebrow">Phase 1 · Story 1.3</p>
        <h1>Tic Tac Toe, ready for a single-player match.</h1>
        <p className="lead">
          Start a local game against the deterministic CPU. This milestone covers the
          landing page, the playable game flow, quit, and rematch.
        </p>
        <div className="status-row">
          <span className="status-pill">Single Player</span>
          <span className="status-pill">Deterministic CPU</span>
          <span className="status-pill">Playable Flow</span>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onPlayCpu} type="button">
            Play vs. CPU
          </button>
        </div>
      </section>
    </main>
  );
}
