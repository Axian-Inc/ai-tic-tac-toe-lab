type LandingPageProps = {
  onStart: () => void
}

const LandingPage = ({ onStart }: LandingPageProps) => {
  return (
    <section className="landing">
      <div className="landing__logo" aria-hidden="true">
        <span className="landing__logo-x">X</span>
        <span className="landing__logo-divider">|</span>
        <span className="landing__logo-o">O</span>
      </div>
      <h1 className="landing__title">
        Tic <span>Tac</span> Toe
      </h1>
      <p className="landing__subtitle">
        The classic game of X's and O's. Can you beat the CPU?
      </p>
      <div className="landing__cta">
        <button className="btn btn--primary" onClick={onStart}>
          <span className="btn__icon" aria-hidden="true">
            ▶
          </span>
          Play vs CPU
        </button>
      </div>
      <div className="landing__stats" aria-label="Matchup">
        <div className="landing__stat">
          <span className="landing__stat-label">X</span>
          <span className="landing__stat-value">You</span>
        </div>
        <div className="landing__stat landing__stat--vs">
          <span className="landing__stat-label">VS</span>
          <span className="landing__stat-value">Battle</span>
        </div>
        <div className="landing__stat">
          <span className="landing__stat-label">O</span>
          <span className="landing__stat-value">CPU</span>
        </div>
      </div>
    </section>
  )
}

export default LandingPage
