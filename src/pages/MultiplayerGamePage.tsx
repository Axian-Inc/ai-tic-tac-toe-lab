import { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import Board from '../components/Board'
import type { Board as GameBoard, Position } from '../game'
import useSound from '../hooks/useSound'
import {
  postMultiplayerMove,
  resignMultiplayerGame,
  subscribeToGame,
  type MultiplayerGame,
  type PlayerSymbol,
} from '../multiplayer'

type MultiplayerGamePageProps = {
  initialGame: MultiplayerGame
  mode: 'player' | 'spectator'
  playerSymbol?: PlayerSymbol
  onQuit: () => void
  showApiLog: boolean
  onLogApiMessage: (message: string) => void
}

const MultiplayerGamePage = ({
  initialGame,
  mode,
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

  const viewerSymbol = playerSymbol ?? null

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
    if (mode === 'spectator') {
      if (game.state.endReason === 'resign') {
        return game.state.winner
          ? `${game.players[game.state.winner] || game.state.winner} wins by resignation.`
          : 'Game ended by resignation.'
      }
      if (game.state.winner) {
        return `${game.players[game.state.winner] || game.state.winner} wins.`
      }
      if (game.state.isDraw) return 'Draw game.'
      return `${game.players[game.state.currentPlayer] || game.state.currentPlayer} to move.`
    }

    if (game.state.endReason === 'resign') {
      return game.state.winner === viewerSymbol
        ? 'Your opponent resigned.'
        : 'You resigned.'
    }
    if (game.state.winner) {
      return game.state.winner === viewerSymbol ? 'You win!' : 'You lose.'
    }
    if (game.state.isDraw) return 'Draw game.'
    return game.state.currentPlayer === viewerSymbol
      ? 'Your turn.'
      : 'Opponent turn.'
  }, [
    game.state.currentPlayer,
    game.state.endReason,
    game.state.isDraw,
    game.state.winner,
    game.players,
    mode,
    viewerSymbol,
  ])

  const canPlayAt = (position: Position) => {
    if (mode !== 'player' || !viewerSymbol) return false
    if (game.status !== 'active') return false
    if (game.state.currentPlayer !== viewerSymbol) return false
    return game.state.board[position.row][position.col] === null
  }

  const handleSelect = async (position: Position) => {
    if (!viewerSymbol || !canPlayAt(position)) return
    playThud()
    try {
      if (showApiLog) {
        onLogApiMessage(`POST /games/${game.id}/moves`)
      }
      const response = await postMultiplayerMove({
        gameId: game.id,
        move: { row: position.row, col: position.col, player: viewerSymbol },
      })
      setGame(response.game)
    } catch {
      // Server will keep authoritative state; ignore transient errors.
    }
  }

  const handleResign = async () => {
    if (mode !== 'player' || !viewerSymbol || game.status !== 'active') return
    try {
      if (showApiLog) {
        onLogApiMessage(`POST /games/${game.id}/resign`)
      }
      const response = await resignMultiplayerGame({
        gameId: game.id,
        player: viewerSymbol,
      })
      setGame(response.game)
    } catch {
      // Ignore transient errors.
    }
  }

  useEffect(() => {
    if (!game.state.winner) {
      lastOutcomeRef.current = null
      return
    }

    if (game.state.winner === lastOutcomeRef.current) return
    lastOutcomeRef.current = game.state.winner

    if (game.state.winner === viewerSymbol) {
      playWin()
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
      })
    } else {
      playLose()
    }
  }, [game.state.winner, mode, playLose, playWin, viewerSymbol])

  const playerXName = game.players.X || 'Player 1'
  const playerOName = game.players.O || 'Player 2'
  const board = game.state.board as GameBoard

  return (
    <section className="game">
      <header className="game__header">
        <p className="game__title">
          Tic <span>Tac</span> Toe
        </p>
        <div className="game__status" aria-label="Matchup">
          <span
            className={`game__status-pill ${
              game.state.currentPlayer === 'X'
                ? 'game__status-pill--active'
                : ''
            }`}
          >
            <span className="game__status-letter">X</span>
            <span className="game__status-role">
              {mode === 'player' && viewerSymbol === 'X' ? 'You' : playerXName}
            </span>
          </span>
          <span className="game__status-divider">VS</span>
          <span
            className={`game__status-pill ${
              game.state.currentPlayer === 'O'
                ? 'game__status-pill--active'
                : ''
            }`}
          >
            <span className="game__status-letter">O</span>
            <span className="game__status-role">
              {mode === 'player' && viewerSymbol === 'O' ? 'You' : playerOName}
            </span>
          </span>
        </div>
        <p className="game__subtitle">{status}</p>
      </header>

      <Board
        board={board}
        canPlayAt={canPlayAt}
        onSelect={handleSelect}
      />

      {mode === 'player' && viewerSymbol && game.state.winner && game.state.winner !== viewerSymbol && (
        <div className="game__alert">Try Again</div>
      )}

      <div className="game__actions">
        {mode === 'player' ? (
          <button
            className="btn btn--ghost"
            onClick={handleResign}
            disabled={game.status !== 'active' || game.state.endReason === 'resign'}
          >
            <span className="btn__icon" aria-hidden="true">
              ✕
            </span>
            Resign
          </button>
        ) : null}
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
