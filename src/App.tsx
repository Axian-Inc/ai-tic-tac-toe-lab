import { useState } from 'react'
import './App.css'
import { createGame, type GameState } from './game'
import GamePage from './pages/GamePage'
import LandingPage from './pages/LandingPage'

type View = 'landing' | 'game'

const App = () => {
  const [view, setView] = useState<View>('landing')
  const [game, setGame] = useState<GameState>(createGame())

  const startGame = () => {
    setGame(createGame())
    setView('game')
  }

  const quitGame = () => {
    setView('landing')
  }

  return (
    <main className="app">
      {view === 'landing' ? (
        <LandingPage onStart={startGame} />
      ) : (
        <GamePage game={game} onUpdateGame={setGame} onQuit={quitGame} />
      )}
    </main>
  )
}

export default App
