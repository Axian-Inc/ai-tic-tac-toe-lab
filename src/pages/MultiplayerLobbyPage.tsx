import type { MultiplayerGameSummary } from '../../shared/contracts';

interface MultiplayerLobbyPageProps {
  readonly waitingGames: readonly MultiplayerGameSummary[];
  readonly isBusy: boolean;
  readonly errorMessage: string | null;
  readonly onBack: () => void;
  readonly onCreate: () => void;
  readonly onJoin: (gameId: string) => void;
  readonly onRefresh: () => void;
}

export function MultiplayerLobbyPage({
  waitingGames,
  isBusy,
  errorMessage,
  onBack,
  onCreate,
  onJoin,
  onRefresh,
}: MultiplayerLobbyPageProps) {
  return (
    <main className="app-shell">
      <section className="hero-card game-panel">
        <p className="eyebrow">Phase 2 · Story 2.4</p>
        <h1>Multiplayer Lobby</h1>
        <p className="lead">
          Create a new server-backed match or join a waiting game. Live board updates
          will arrive over WebSocket once a match is active.
        </p>
        <div className="status-row">
          <span className="status-pill">HTTP Create / Join</span>
          <span className="status-pill">Live WebSocket Updates</span>
          <span className="status-pill">Two-Client Play</span>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            Back
          </button>
          <button className="secondary-button" onClick={onRefresh} type="button">
            Refresh Waiting Games
          </button>
          <button className="primary-button" disabled={isBusy} onClick={onCreate} type="button">
            Create Multiplayer Game
          </button>
        </div>
        {errorMessage ? <p className="feedback-banner">{errorMessage}</p> : null}
      </section>

      <section className="info-card lobby-card">
        <div className="board-panel__header">
          <h2>Waiting Games</h2>
          <p>{waitingGames.length} available</p>
        </div>
        {waitingGames.length === 0 ? (
          <p>No waiting games yet. Create one from this screen and open a second browser to join it.</p>
        ) : (
          <div className="lobby-list">
            {waitingGames.map((game) => (
              <article className="lobby-list__item" key={game.id}>
                <div>
                  <h3>{game.id}</h3>
                  <p>Created {new Date(game.createdAt).toLocaleTimeString()}</p>
                </div>
                <button className="primary-button" disabled={isBusy} onClick={() => onJoin(game.id)} type="button">
                  Join {game.id}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
