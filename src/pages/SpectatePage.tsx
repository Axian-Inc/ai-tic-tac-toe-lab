import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type SpectateGame = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  moveCount: number;
};

function getApiBase() {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE;
  return env?.trim() ? env.trim() : "http://localhost:3001";
}

export default function SpectatePage() {
  const apiBase = useMemo(() => getApiBase(), []);
  const mountedRef = useRef(true);
  const [games, setGames] = useState<SpectateGame[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(() => {
    setStatus("loading");
    setError(null);
    fetch(`${apiBase}/games?status=active`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load games (${response.status})`);
        }
        return response.json() as Promise<{ games?: SpectateGame[] }>;
      })
      .then((data) => {
        if (!mountedRef.current) {
          return;
        }
        const nextGames = data.games ?? [];
        setGames(nextGames);
        setSelectedId((prev) => {
          if (prev && nextGames.some((game) => game.id === prev)) {
            return prev;
          }
          return nextGames[0]?.id ?? null;
        });
        setStatus("idle");
      })
      .catch((err) => {
        if (!mountedRef.current) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load games.");
        setStatus("error");
      });
  }, [apiBase]);

  useEffect(() => {
    mountedRef.current = true;
    loadGames();
    return () => {
      mountedRef.current = false;
    };
  }, [loadGames]);

  const selected = games.find((game) => game.id === selectedId) ?? null;

  return (
    <section className="spectate-page">
      <div className="spectate-header">
        <div>
          <h1>Spectate games</h1>
          <p>Select a multiplayer game to watch it live.</p>
        </div>
        <Link className="secondary-button" to="/">
          Back home
        </Link>
      </div>
      <div className="spectate-layout">
        <div className="spectate-list" data-testid="spectate-list">
          <div className="spectate-list-header">
            <h2>Live games</h2>
            <div className="spectate-actions">
              {status === "loading" ? <span className="hint">Loading...</span> : null}
              <button
                className="secondary-button"
                type="button"
                onClick={loadGames}
                disabled={status === "loading"}
              >
                Refresh
              </button>
            </div>
          </div>
          {status === "error" ? <p className="error-text">{error}</p> : null}
          {status !== "error" && games.length === 0 ? (
            <p className="hint">No active games right now.</p>
          ) : (
            <ul className="spectate-items">
              {games.map((game) => (
                <li key={game.id}>
                  <div
                    className={`spectate-item ${selectedId === game.id ? "is-active" : ""}`}
                  >
                    <button
                      className="spectate-select"
                      type="button"
                      onClick={() => setSelectedId(game.id)}
                    >
                      <span className="spectate-id">{game.id}</span>
                      <span className="spectate-meta">Moves: {game.moveCount}</span>
                      <span className="spectate-meta">
                        Updated:{" "}
                        <time dateTime={game.updatedAt} data-game-id={game.id}>
                          {new Date(game.updatedAt).toLocaleString("en-US")}
                        </time>
                      </span>
                    </button>
                    <Link className="spectate-watch" to={`/spectate/${encodeURIComponent(game.id)}`}>
                      Watch
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="spectate-detail" data-testid="spectate-detail">
          {selected ? (
            <>
              <h2>Game details</h2>
              <div className="spectate-card">
                <div className="spectate-row">
                  <span className="label">Game ID</span>
                  <span className="value">{selected.id}</span>
                </div>
                <div className="spectate-row">
                  <span className="label">Status</span>
                  <span className="value">{selected.status}</span>
                </div>
                <div className="spectate-row">
                  <span className="label">Moves</span>
                  <span className="value">{selected.moveCount}</span>
                </div>
              </div>
              <Link
                className="primary-button"
                to={`/spectate/${encodeURIComponent(selected.id)}`}
              >
                Watch game
              </Link>
            </>
          ) : (
            <>
              <h2>Game details</h2>
              <p className="hint">Select a game to view details.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
