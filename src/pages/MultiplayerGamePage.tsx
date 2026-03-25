import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Board from '../components/Board'
import type { Position } from '../game'
import useSound from '../hooks/useSound'
import {
  postMultiplayerMove,
  subscribeToGame,
  type MultiplayerGame,
  type PlayerSymbol,
} from '../multiplayer'

type MultiplayerGamePageProps = {
  initialGame: MultiplayerGame
  playerSymbol: PlayerSymbol
  onQuit: () => void
  showApiLog: boolean
  onLogApiMessage: (message: string) => void
}

const MultiplayerGamePage = ({
  initialGame,
  playerSymbol,
  onQuit,
  showApiLog,
  onLogApiMessage,
}: MultiplayerGamePageProps) => {
  const [game, setGame] = useState(initialGame)
  const playThud = useSound('thud')
  const playWin = useSound('win')
  const playLose = useSound('lose')
  const lastOutcomeRef = useRef<MultiplayerGame['state']['winner']>(null)

  useEffect(() => {
    setGame(initialGame)
  }, [initialGame.id])

  useEffect(() => {
    if (showApiLog) {
      onLogApiMessage(`WS /ws?gameId=${initialGame.id}`)
    }
    const unsubscribe = subscribeToGame(initialGame.id, (message) => {
      if (message.type === 'game_state') {
        setGame(message.game)
      }

      if (message.type === 'game_update') {
        setGame(message.game)
      }

      if (message.type === 'game_over') {
        setGame(message.game)
      }
    })

    return () => unsubscribe()
  }, [initialGame.id])

  const status = useMemo(() => {
    if (game.state.winner) {
      return game.state.winner === playerSymbol ? 'You win!' : 'You lose.'
    }
    if (game.state.isDraw) return 'Draw game.'
    return game.state.currentPlayer === playerSymbol
      ? 'Your turn.'
      : 'Opponent turn.'
  }, [game.state.currentPlayer, game.state.isDraw, game.state.winner, playerSymbol])

  const canPlayAt = (position: Position) => {
    if (game.status !== 'active') return false
    if (game.state.currentPlayer !== playerSymbol) return false
    return game.state.board[position.row][position.col] === null
  }

  const handleSelect = async (position: Position) => {
    if (!canPlayAt(position)) return
    playThud()
    try {
      if (showApiLog) {
        onLogApiMessage(`POST /games/${game.id}/moves`)
      }
      const response = await postMultiplayerMove({
        gameId: game.id,
        move: { row: position.row, col: position.col, player: playerSymbol },
      })
      setGame(response.game)
    } catch {
      // Server will keep authoritative state; ignore transient errors.
    }
  }

  useEffect(() => {
    if (!game.state.winner) {
      lastOutcomeRef.current = null
      return
    }

    if (game.state.winner === lastOutcomeRef.current) return
    lastOutcomeRef.current = game.state.winner

    if (game.state.winner === playerSymbol) {
      playWin()
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
      })
    } else {
      playLose()
    }
  }, [game.state.winner, playLose, playWin, playerSymbol])

  const opponentSymbol: PlayerSymbol = playerSymbol === 'X' ? 'O' : 'X'

  return (
    <section className="game">
      <header className="game__header">
        <p className="game__title">
          Tic <span>Tac</span> Toe
        </p>
        <div className="game__status" aria-label="Matchup">
          <span
            className={`game__status-pill ${
              game.state.currentPlayer === playerSymbol
                ? 'game__status-pill--active'
                : ''
            }`}
          >
            <span className="game__status-letter">{playerSymbol}</span>
            <span className="game__status-role">You</span>
          </span>
          <span className="game__status-divider">VS</span>
          <span
            className={`game__status-pill ${
              game.state.currentPlayer === opponentSymbol
                ? 'game__status-pill--active'
                : ''
            }`}
          >
            <span className="game__status-letter">{opponentSymbol}</span>
            <span className="game__status-role">Opponent</span>
          </span>
        </div>
        <p className="game__subtitle">{status}</p>
      </header>

      <Board
        board={game.state.board}
        canPlayAt={canPlayAt}
        onSelect={handleSelect}
      />

      {game.state.winner && game.state.winner !== playerSymbol && (
        <div className="game__alert">Try Again</div>
      )}

      <div className="game__actions">
        <button className="btn btn--ghost" onClick={onQuit}>
          <span className="btn__icon" aria-hidden="true">
            ⌂
          </span>
          Home
        </button>
      </div>
    </section>
  )
}

export default MultiplayerGamePage
