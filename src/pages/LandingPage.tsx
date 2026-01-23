import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <section>
      <h1>Welcome to Tic Tac Toe</h1>
      <p>Play a local match against a deterministic CPU opponent.</p>
      <div className="role-list">
        <span className="role-chip">You: X</span>
        <span className="role-chip">CPU: O</span>
      </div>
      <Link className="primary-button" to="/game?human=X&cpu=O">
        Play vs CPU
      </Link>
    </section>
  );
}
