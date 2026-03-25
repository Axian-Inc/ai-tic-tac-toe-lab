import { useEffect, useState } from 'react'
import { listWaitingGames, type GameSummary } from '../multiplayer'

type LandingPageProps = {
  onStartSingle: () => void
  onCreateMultiplayer: (payload: {
    playerName: string
    gameName: string
  }) => Promise<void>
  onJoinMultiplayer: (payload: {
    gameId: string
    playerName: string
  }) => Promise<void>
  showApiLog: boolean
  onToggleApiLog: (value: boolean) => void
  onLogApiMessage: (message: string) => void
}

const LandingPage = ({
  onStartSingle,
  onCreateMultiplayer,
  onJoinMultiplayer,
  showApiLog,
  onToggleApiLog,
  onLogApiMessage,
}: LandingPageProps) => {
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const [hostName, setHostName] = useState('')
  const [gameName, setGameName] = useState('')
  const [joinName, setJoinName] = useState('')
  const [availableGames, setAvailableGames] = useState<GameSummary[]>([])
  const [selectedGameId, setSelectedGameId] = useState('')
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const openMultiplayer = () => {
    setActiveTab('create')
    setIsMultiplayerOpen(true)
    setErrorMessage('')
  }

  const closeMultiplayer = () => {
    setIsMultiplayerOpen(false)
  }

  const canCreate = hostName.trim().length > 0 && gameName.trim().length > 0
  const canJoin =
    joinName.trim().length > 0 && selectedGameId.trim().length > 0

  const loadGames = async () => {
    setIsLoadingGames(true)
    setErrorMessage('')
    onLogApiMessage('GET /games?status=waiting')
    try {
      const games = await listWaitingGames()
      setAvailableGames(games)
      if (games.length === 0) {
        setSelectedGameId('')
      } else if (!games.find((game) => game.id === selectedGameId)) {
        setSelectedGameId(games[0].id)
      }
    } catch (error) {
      setAvailableGames([])
      setSelectedGameId('')
      const message =
        error instanceof Error ? error.message : 'Unable to load games.'
      setErrorMessage(message)
    } finally {
      setIsLoadingGames(false)
    }
  }

  const handleCreate = async () => {
    if (!canCreate) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await onCreateMultiplayer({
        playerName: hostName.trim(),
        gameName: gameName.trim(),
      })
      setIsMultiplayerOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create game.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoin = async () => {
    if (!canJoin) return
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await onJoinMultiplayer({
        gameId: selectedGameId,
        playerName: joinName.trim(),
      })
      setIsMultiplayerOpen(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to join game.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isMultiplayerOpen) return
    if (activeTab === 'join') {
      loadGames()
    }
  }, [activeTab, isMultiplayerOpen])

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
        <button className="btn btn--primary" onClick={onStartSingle}>
          <span className="btn__icon" aria-hidden="true">
            ▶
          </span>
          Play vs CPU
        </button>
        <button className="btn btn--ghost" onClick={openMultiplayer}>
          New Multiplayer
        </button>
      </div>
      <label className="landing__toggle">
        <input
          type="checkbox"
          checked={showApiLog}
          onChange={(event) => onToggleApiLog(event.target.checked)}
        />
        <span>Show API activity</span>
      </label>
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
      {isMultiplayerOpen ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__backdrop" onClick={closeMultiplayer} />
          <div className="modal__panel">
            <header className="modal__header">
              <div>
                <p className="modal__eyebrow">Multiplayer</p>
                <h2 className="modal__title">Start a live match</h2>
              </div>
              <button
                className="btn btn--icon"
                type="button"
                aria-label="Close multiplayer dialog"
                onClick={closeMultiplayer}
              >
                ✕
              </button>
            </header>
            <div className="modal__tabs" role="tablist" aria-label="Multiplayer">
              <button
                className={`modal__tab ${
                  activeTab === 'create' ? 'modal__tab--active' : ''
                }`}
                type="button"
                role="tab"
                aria-selected={activeTab === 'create'}
                onClick={() => setActiveTab('create')}
              >
                Create
              </button>
              <button
                className={`modal__tab ${
                  activeTab === 'join' ? 'modal__tab--active' : ''
                }`}
                type="button"
                role="tab"
                aria-selected={activeTab === 'join'}
                onClick={() => setActiveTab('join')}
              >
                Join
              </button>
            </div>
            <div className="modal__body">
              {activeTab === 'create' ? (
                <div className="modal__form">
                  <label className="modal__field">
                    <span>Your Name</span>
                    <input
                      value={hostName}
                      onChange={(event) => setHostName(event.target.value)}
                      placeholder="Enter your name"
                    />
                  </label>
                  <label className="modal__field">
                    <span>Game Name</span>
                    <input
                      value={gameName}
                      onChange={(event) => setGameName(event.target.value)}
                      placeholder="Friendly match name"
                    />
                  </label>
                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={!canCreate || isSubmitting}
                    onClick={handleCreate}
                  >
                    Create Game
                  </button>
                </div>
              ) : (
                <div className="modal__form">
                  <label className="modal__field">
                    <span>Your Name</span>
                    <input
                      value={joinName}
                      onChange={(event) => setJoinName(event.target.value)}
                      placeholder="Enter your name"
                    />
                  </label>
                  <div className="modal__list">
                    <div className="modal__list-header">
                      <span>Available Games</span>
                      <button
                        className="btn btn--inline"
                        type="button"
                        onClick={loadGames}
                        disabled={isLoadingGames}
                      >
                        Refresh
                      </button>
                    </div>
                    {availableGames.length === 0 ? (
                      <p className="modal__empty">
                        No games available yet. Try refreshing in a moment.
                      </p>
                    ) : (
                      <div className="modal__games">
                        {availableGames.map((game) => (
                          <label className="modal__game" key={game.id}>
                            <input
                              type="radio"
                              name="game"
                              value={game.id}
                              checked={selectedGameId === game.id}
                              onChange={() => setSelectedGameId(game.id)}
                            />
                            <div>
                              <span className="modal__game-name">
                                {game.name || 'Untitled Match'}
                              </span>
                              <span className="modal__game-meta">
                                Host: {game.players.X || 'Unknown'}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={!canJoin || isSubmitting}
                    onClick={handleJoin}
                  >
                    Join Game
                  </button>
                </div>
              )}
            </div>
            {errorMessage ? (
              <p className="modal__error" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default LandingPage
