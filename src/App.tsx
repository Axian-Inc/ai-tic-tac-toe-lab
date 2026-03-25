import { useState } from 'react'
import './App.css'
import { createGame, type GameState } from './game'
import GamePage from './pages/GamePage'
import LandingPage from './pages/LandingPage'
import MultiplayerGamePage from './pages/MultiplayerGamePage'
import {
  createMultiplayerGame,
  joinMultiplayerGame,
  type MultiplayerGame,
  type PlayerSymbol,
} from './multiplayer'

type View = 'landing' | 'game' | 'multiplayer'

const App = () => {
  const [view, setView] = useState<View>('landing')
  const [game, setGame] = useState<GameState>(createGame())
  const [multiplayerGame, setMultiplayerGame] =
    useState<MultiplayerGame | null>(null)
  const [playerSymbol, setPlayerSymbol] = useState<PlayerSymbol>('X')
  const showApiLogDefault =
    String(import.meta.env.VITE_SHOW_API_LOG || '').toLowerCase() === 'true'
  const [showApiLog, setShowApiLog] = useState(showApiLogDefault)
  const [apiMessage, setApiMessage] = useState('')

  const logApiMessage = (message: string) => {
    if (!showApiLog) return
    const timestamp = new Date().toLocaleTimeString()
    setApiMessage(`[${timestamp}] ${message}`)
  }

  const startGame = () => {
    setGame(createGame())
    setView('game')
  }

  const startMultiplayerCreate = async (payload: {
    playerName: string
    gameName: string
  }) => {
    logApiMessage('POST /games')
    const response = await createMultiplayerGame(payload)
    setMultiplayerGame(response.game)
    setPlayerSymbol('X')
    setView('multiplayer')
  }

  const startMultiplayerJoin = async (payload: {
    gameId: string
    playerName: string
  }) => {
    logApiMessage(`POST /games/${payload.gameId}/join`)
    const response = await joinMultiplayerGame(payload)
    setMultiplayerGame(response.game)
    setPlayerSymbol('O')
    setView('multiplayer')
  }

  const quitGame = () => {
    setView('landing')
    setMultiplayerGame(null)
  }

  return (
    <main className="app">
      {view === 'landing' ? (
        <LandingPage
          onStartSingle={startGame}
          onCreateMultiplayer={startMultiplayerCreate}
          onJoinMultiplayer={startMultiplayerJoin}
          showApiLog={showApiLog}
          onToggleApiLog={setShowApiLog}
          onLogApiMessage={logApiMessage}
        />
      ) : null}
      {view === 'game' ? (
        <GamePage game={game} onUpdateGame={setGame} onQuit={quitGame} />
      ) : null}
      {view === 'multiplayer' && multiplayerGame ? (
        <MultiplayerGamePage
          initialGame={multiplayerGame}
          playerSymbol={playerSymbol}
          onQuit={quitGame}
          showApiLog={showApiLog}
          onLogApiMessage={logApiMessage}
        />
      ) : null}
      {showApiLog ? (
        <div className="api-log" aria-live="polite">
          {apiMessage ? (
            <span className="api-log__line">{apiMessage}</span>
          ) : (
            <span className="api-log__empty">API activity will appear here.</span>
          )}
        </div>
      ) : null}
    </main>
  )
}

export default App
