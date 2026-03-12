type LandingPageProps = {
  onStart: () => void
}

const LandingPage = ({ onStart }: LandingPageProps) => {
  return (
    <section className="landing">
      <div className="landing__hero">
        <div className="landing__badge">Axian LnD Lab</div>
        <h1>Tic Tac Toe</h1>
        <p className="landing__subtitle">
          A crisp, deterministic match against a CPU that only moves when you say so.
        </p>
        <div className="landing__actions">
          <button className="btn btn--primary" onClick={onStart}>
            Play
          </button>
          <div className="landing__note">You are X. CPU is O.</div>
        </div>
      </div>
      <div className="landing__card">
        <div className="landing__card-header">How it works</div>
        <ul className="landing__list">
          <li>Click a square to place X.</li>
          <li>Press CPU Move to let O respond.</li>
          <li>Rematch and Quit are available after each game.</li>
        </ul>
      </div>
    </section>
  )
}

export default LandingPage
