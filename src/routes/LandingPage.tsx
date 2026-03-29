import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createMultiplayerGame,
  joinGame,
  listGames,
  MultiplayerApiError,
} from '../multiplayer/api';
import { createSuggestedGameName } from '../multiplayer/gameNames';
import { saveParticipantSession } from '../multiplayer/storage';
import type { MultiplayerGameStatus, WaitingGameSummary } from '../multiplayer/types';
import styles from './LandingPage.module.css';

type MultiplayerDialogMode = 'create' | 'join' | 'spectate' | null;

const LANDING_WATERMARK = 'release 2026.03.29.1';

const GAME_STATUS_LABELS: Record<MultiplayerGameStatus, string> = {
  waiting: 'Waiting',
  active: 'Live',
  over: 'Finished',
};

function byUpdatedAtDesc(left: WaitingGameSummary, right: WaitingGameSummary) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

export function LandingPage() {
  const navigate = useNavigate();
  const [dialogMode, setDialogMode] = useState<MultiplayerDialogMode>(null);
  const [playerName, setPlayerName] = useState('Major Mischief');
  const [gameName, setGameName] = useState(() => createSuggestedGameName());
  const [availableGames, setAvailableGames] = useState<WaitingGameSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const [isRefreshingGames, setIsRefreshingGames] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (dialogMode !== 'join' && dialogMode !== 'spectate') {
      return;
    }

    void refreshAvailableGames();
  }, [dialogMode]);

  function openCreateDialog() {
    setErrorMessage(null);
    setDialogMode('create');
  }

  function openJoinDialog() {
    setErrorMessage(null);
    setDialogMode('join');
  }

  function openSpectateDialog() {
    setErrorMessage(null);
    setDialogMode('spectate');
  }

  function closeDialog() {
    setDialogMode(null);
    setErrorMessage(null);
    setJoiningGameId(null);
    setGameName(createSuggestedGameName());
  }

  async function refreshAvailableGames() {
    setErrorMessage(null);
    setIsRefreshingGames(true);

    try {
      if (dialogMode === 'join') {
        const waitingGames = await listGames('waiting');
        setAvailableGames(waitingGames.sort(byUpdatedAtDesc));
        return;
      }

      const [activeGames, overGames] = await Promise.all([
        listGames('active'),
        listGames('over'),
      ]);

      setAvailableGames([...activeGames, ...overGames].sort(byUpdatedAtDesc));
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to load multiplayer games.',
      );
    } finally {
      setIsRefreshingGames(false);
    }
  }

  async function handleCreateMultiplayerGame() {
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const nextGameName = gameName.trim() || createSuggestedGameName();
      const nextPlayerName = playerName.trim();

      if (!nextPlayerName) {
        throw new MultiplayerApiError('invalid_request', 'Enter your name before creating a game.', 400);
      }

      const response = await createMultiplayerGame(nextGameName, nextPlayerName);
      saveParticipantSession(response.game.gameId, {
        playerId: response.participant.playerId,
        mark: response.participant.mark,
      });
      navigate(`/game/${response.game.gameId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to create a multiplayer game.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinMultiplayerGame(gameId: string) {
    setJoiningGameId(gameId);
    setErrorMessage(null);

    try {
      const nextPlayerName = playerName.trim();

      if (!nextPlayerName) {
        throw new MultiplayerApiError('invalid_request', 'Enter your name before joining a game.', 400);
      }

      const response = await joinGame(gameId, nextPlayerName);
      saveParticipantSession(gameId, {
        playerId: response.participant.playerId,
        mark: response.participant.mark,
      });
      navigate(`/game/${gameId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to join that multiplayer game.',
      );
      await refreshAvailableGames();
    } finally {
      setJoiningGameId(null);
    }
  }

  function handleSpectateGame(gameId: string) {
    navigate(`/game/${gameId}`);
  }

  const isDialogOpen = dialogMode !== null;
  const isCreateDialog = dialogMode === 'create';
  const isJoinDialog = dialogMode === 'join';
  const isSpectateDialog = dialogMode === 'spectate';
  const subtitle = isCreateDialog
    ? 'Set up a fresh match and share the link once the board is ready.'
    : isJoinDialog
      ? 'Find a waiting match with an open seat and join as O.'
      : 'Watch a live game or replay a finished one.';
  const liveGames = availableGames.filter((game) => game.status === 'active');
  const finishedGames = availableGames.filter((game) => game.status === 'over');

  return (
    <main className={styles.page}>
      <div className={styles.markTopLeft} aria-hidden="true">
        X
      </div>
      <div className={styles.markBottomRight} aria-hidden="true">
        O
      </div>

      <section className={styles.hero} aria-label="Tic Tac Toe landing page">
        <header className={styles.branding}>
          <p className={styles.symbolTitle} aria-label="X versus O">
            <span className={styles.symbolX}>X</span>
            <span className={styles.divider} aria-hidden="true">
              |
            </span>
            <span className={styles.symbolO}>O</span>
          </p>
          <h1 className={styles.heading}>Tic Tac Toe</h1>
          <p className={styles.subtitle}>
            The classic game of X&apos;s and O&apos;s. Challenge the CPU or a friend!
          </p>
        </header>

        <div className={styles.playActions}>
          <Link className={styles.playButton} to="/game/cpu">
            Play vs CPU
          </Link>
          <button
            className={`${styles.playButton} ${styles.playButtonAlt}`}
            type="button"
            onClick={openCreateDialog}
          >
            New Multiplayer
          </button>
          <button
            className={`${styles.playButton} ${styles.playButtonGhost}`}
            type="button"
            onClick={openSpectateDialog}
          >
            Spectate
          </button>
        </div>

        <section className={styles.matchup} aria-label="Player matchup">
          <div className={styles.matchupColumn}>
            <p className={`${styles.matchupSymbol} ${styles.symbolX}`}>X</p>
            <p className={styles.matchupLabel}>PLAYER 1</p>
          </div>
          <div className={styles.matchupColumn}>
            <p className={styles.matchupCenterTop}>VS</p>
            <p className={styles.matchupLabel}>BATTLE</p>
          </div>
          <div className={styles.matchupColumn}>
            <p className={`${styles.matchupSymbol} ${styles.symbolO}`}>O</p>
            <p className={styles.matchupLabel}>PLAYER 2</p>
          </div>
        </section>

        <p className={styles.watermark} aria-label={`Landing page version ${LANDING_WATERMARK}`}>
          {LANDING_WATERMARK}
        </p>
      </section>

      {isDialogOpen ? (
        <div className={styles.dialogScrim} role="presentation" onClick={closeDialog}>
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Multiplayer"
            onClick={(event) => event.stopPropagation()}
          >
            <button className={styles.closeButton} type="button" onClick={closeDialog} aria-label="Close multiplayer">
              ×
            </button>

            <div className={styles.dialogHeader}>
              <p className={styles.dialogLogo} aria-hidden="true">
                <span className={styles.symbolX}>X</span>
                <span className={styles.divider}>|</span>
                <span className={styles.symbolO}>O</span>
              </p>
              <h2 className={styles.dialogTitle}>{isSpectateDialog ? 'Spectate' : 'Multiplayer'}</h2>
              <p className={styles.dialogSubtitle}>{subtitle}</p>
            </div>

            {!isSpectateDialog ? (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Your Name</span>
                  <input
                    className={styles.fieldInput}
                    name="playerName"
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    autoComplete="off"
                  />
                </label>

                <div className={styles.modeSwitch} aria-label="Multiplayer mode">
                  <button
                    className={`${styles.modeButton} ${isCreateDialog ? styles.modeButtonActive : ''}`}
                    type="button"
                    onClick={openCreateDialog}
                    aria-pressed={isCreateDialog}
                  >
                    Create
                  </button>
                  <button
                    className={`${styles.modeButton} ${isJoinDialog ? styles.modeButtonActive : ''}`}
                    type="button"
                    onClick={openJoinDialog}
                    aria-pressed={isJoinDialog}
                  >
                    Join
                  </button>
                </div>
              </>
            ) : null}

            {isCreateDialog ? (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Game Name</span>
                  <input
                    className={styles.fieldInput}
                    name="gameName"
                    value={gameName}
                    onChange={(event) => setGameName(event.target.value)}
                    autoComplete="off"
                  />
                </label>

                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={handleCreateMultiplayerGame}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating Game...' : 'Create Game'}
                </button>
              </>
            ) : (
              <section
                className={styles.availableGamesSection}
                aria-label={isJoinDialog ? 'Joinable games' : 'Spectator games'}
              >
                <div className={styles.availableGamesHeader}>
                  <span className={styles.fieldLabel}>
                    {isJoinDialog ? 'Joinable Games' : 'Games to Watch'}
                  </span>
                  <button
                    className={styles.refreshButton}
                    type="button"
                    onClick={refreshAvailableGames}
                    disabled={isRefreshingGames}
                    aria-label="Refresh available games"
                  >
                    ↻
                  </button>
                </div>

                {isJoinDialog ? (
                  <>
                    {availableGames.length === 0 && !isRefreshingGames ? (
                      <p className={styles.emptyState}>No joinable games right now. Create one!</p>
                    ) : null}

                    <div className={styles.availableGameList}>
                      {availableGames.map((game) => {
                        const isJoiningThisGame = joiningGameId === game.gameId;

                        return (
                          <article key={game.gameId} className={styles.availableGameCard}>
                            <div className={styles.availableGameMeta}>
                              <div className={styles.availableGameTopRow}>
                                <p className={styles.availableGameId}>{game.gameName}</p>
                                <span className={styles.statusBadge}>{GAME_STATUS_LABELS[game.status]}</span>
                              </div>
                              <p className={styles.availableGameHint}>Open seat available. Join as O.</p>
                            </div>

                            <div className={styles.availableGameActions}>
                              <button
                                className={styles.primaryCompactButton}
                                type="button"
                                onClick={() => handleJoinMultiplayerGame(game.gameId)}
                                disabled={isJoiningThisGame}
                              >
                                {isJoiningThisGame ? 'Joining...' : 'Join'}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className={styles.spectateSections}>
                    <section className={styles.gameBucket} aria-label="Live games">
                      <div className={styles.gameBucketHeader}>
                        <span className={styles.fieldLabel}>Live Games</span>
                        <span className={`${styles.bucketMarker} ${styles.bucketMarkerLive}`}>Live</span>
                      </div>
                      {liveGames.length === 0 && !isRefreshingGames ? (
                        <p className={styles.emptyState}>No live games to spectate.</p>
                      ) : null}
                      <div className={styles.availableGameList}>
                        {liveGames.map((game) => (
                          <article
                            key={game.gameId}
                            className={`${styles.availableGameCard} ${styles.availableGameCardLive}`}
                          >
                            <div className={styles.availableGameMeta}>
                              <div className={styles.availableGameTopRow}>
                                <p className={styles.availableGameId}>{game.gameName}</p>
                                <span className={styles.statusBadge}>{GAME_STATUS_LABELS[game.status]}</span>
                              </div>
                              <p className={styles.availableGameHint}>Match in progress. Spectate live.</p>
                            </div>

                            <div className={styles.availableGameActions}>
                              <button
                                className={styles.primaryCompactButton}
                                type="button"
                                onClick={() => handleSpectateGame(game.gameId)}
                              >
                                Spectate
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className={styles.gameBucket} aria-label="Finished games">
                      <div className={styles.gameBucketHeader}>
                        <span className={styles.fieldLabel}>Finished Games</span>
                        <span className={`${styles.bucketMarker} ${styles.bucketMarkerFinished}`}>Replay</span>
                      </div>
                      {finishedGames.length === 0 && !isRefreshingGames ? (
                        <p className={styles.emptyState}>No finished games available yet.</p>
                      ) : null}
                      <div className={styles.availableGameList}>
                        {finishedGames.map((game) => (
                          <article
                            key={game.gameId}
                            className={`${styles.availableGameCard} ${styles.availableGameCardFinished}`}
                          >
                            <div className={styles.availableGameMeta}>
                              <div className={styles.availableGameTopRow}>
                                <p className={styles.availableGameId}>{game.gameName}</p>
                                <span className={styles.statusBadge}>{GAME_STATUS_LABELS[game.status]}</span>
                              </div>
                              <p className={styles.availableGameHint}>Finished game. Open replay state.</p>
                            </div>

                            <div className={styles.availableGameActions}>
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                onClick={() => handleSpectateGame(game.gameId)}
                              >
                                View Replay
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </section>
            )}

            {errorMessage ? <p className={styles.dialogError}>{errorMessage}</p> : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}
