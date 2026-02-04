import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "join">("new");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const openMultiplayer = (nextMode: "new" | "join") => {
    setMode(nextMode);
    setIsMultiplayerOpen(true);
  };

  const handleCreateRoom = () => {
    setIsMultiplayerOpen(false);
    navigate("/multiplayer?mode=create");
  };

  const handleJoinRoom = () => {
    setIsMultiplayerOpen(false);
    const trimmed = roomCode.trim();
    if (trimmed) {
      navigate(`/multiplayer?mode=join&room=${encodeURIComponent(trimmed)}`);
      return;
    }
    navigate("/multiplayer?mode=join");
  };

  return (
    <section>
      <h1>Welcome to Tic Tac Toe</h1>
      <p>Play a local match against a deterministic CPU opponent.</p>
      <div className="role-list">
        <span className="role-chip">You: X</span>
        <span className="role-chip">CPU: O</span>
      </div>
      <Link
        className="primary-button"
        to="/game?human=X&cpu=O"
        data-testid="play-vs-cpu"
      >
        Play vs CPU
      </Link>
      <div className="multiplayer-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => openMultiplayer("new")}
          data-testid="new-multiplayer"
        >
          New Multiplayer
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => openMultiplayer("join")}
          data-testid="join-multiplayer"
        >
          Join Multiplayer
        </button>
      </div>
      {isMultiplayerOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Multiplayer</h2>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setIsMultiplayerOpen(false)}
                aria-label="Close multiplayer modal"
              >
                Close
              </button>
            </div>
            <div className="modal-body" data-testid="multiplayer-modal">
              <div className="multiplayer-mode">
                <button
                  className={`secondary-button ${mode === "new" ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setMode("new")}
                >
                  New game
                </button>
                <button
                  className={`secondary-button ${mode === "join" ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setMode("join")}
                >
                  Join game
                </button>
              </div>
              {mode === "new" ? (
                <div className="multiplayer-panel">
                  <p>Create a new room and share the code with a friend.</p>
                  <button className="primary-button" type="button" onClick={handleCreateRoom}>
                    Create room
                  </button>
                </div>
              ) : (
                <div className="multiplayer-panel">
                  <p>Enter a room code to join an existing game.</p>
                  <label className="input-label" htmlFor="room-code">
                    Room code
                  </label>
                  <input
                    id="room-code"
                    className="text-input"
                    type="text"
                    placeholder="e.g. 8f3b2c"
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value)}
                  />
                  <button className="primary-button" type="button" onClick={handleJoinRoom}>
                    Join room
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
