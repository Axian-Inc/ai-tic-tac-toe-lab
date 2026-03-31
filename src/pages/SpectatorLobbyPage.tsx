import type { MultiplayerGameSummary } from '../../shared/contracts';

interface SpectatorLobbyPageProps {
  readonly activeGames: readonly MultiplayerGameSummary[];
  readonly isBusy: boolean;
  readonly errorMessage: string | null;
  readonly onBack: () => void;
  readonly onRefresh: () => void;
  readonly onWatch: (gameId: string) => void;
}

export function SpectatorLobbyPage({
  activeGames,
  isBusy,
  errorMessage,
  onBack,
  onRefresh,
  onWatch,
}: SpectatorLobbyPageProps) {
  return (
    <main className="app-shell">
      <section className="hero-card game-panel">
        <p className="eyebrow">Phase 3 · Story 3.2</p>
        <h1>Spectator Lobby</h1>
        <p className="lead">
          Watch any active multiplayer match in real time. Select a live game to load its
          current state, then stay synchronized over WebSocket as the players continue.
        </p>
        <div className="status-row">
          <span className="status-pill">Active Game Discovery</span>
          <span className="status-pill">Snapshot Catch-Up</span>
          <span className="status-pill">Realtime Spectating</span>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            Back
          </button>
          <button className="secondary-button" onClick={onRefresh} type="button">
            Refresh Active Games
          </button>
        </div>
        {errorMessage ? <p className="feedback-banner">{errorMessage}</p> : null}
      </section>

      <section className="info-card lobby-card">
        <div className="board-panel__header">
          <h2>Active Games</h2>
          <p>{activeGames.length} live</p>
        </div>
        {activeGames.length === 0 ? (
          <p>No active games right now. Start or join a multiplayer match first, then return here to spectate it.</p>
        ) : (
          <div className="lobby-list">
            {activeGames.map((game) => (
              <article className="lobby-list__item" key={game.id}>
                <div>
                  <h3>{game.id}</h3>
                  <p>
                    {game.moveCount} moves · Updated {new Date(game.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
                <button className="primary-button" disabled={isBusy} onClick={() => onWatch(game.id)} type="button">
                  Watch {game.id}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
