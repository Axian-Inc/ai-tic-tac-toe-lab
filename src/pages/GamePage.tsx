import { useEffect, useMemo, useRef } from 'react'
import confetti from 'canvas-confetti'
import Board from '../components/Board'
import {
  createGame,
  getCpuMove,
  isMoveValid,
  makeMove,
  type GameState,
  type Position,
} from '../game'
import useSound from '../hooks/useSound'

type GamePageProps = {
  game: GameState
  onUpdateGame: (next: GameState) => void
  onQuit: () => void
}

const GamePage = ({ game, onUpdateGame, onQuit }: GamePageProps) => {
  const playThud = useSound('thud')
  const playWin = useSound('win')
  const playLose = useSound('lose')
  const lastOutcomeRef = useRef<GameState['winner']>(null)

  const status = useMemo(() => {
    if (game.winner === 'X') return 'You win!'
    if (game.winner === 'O') return 'CPU wins.'
    if (game.isDraw) return 'Draw game.'
    return game.currentPlayer === 'X' ? 'Your turn.' : 'CPU turn.'
  }, [game])

  const canPlayAt = (position: Position) =>
    game.currentPlayer === 'X' && isMoveValid(game, position)

  const handleSelect = (position: Position) => {
    if (!canPlayAt(position)) return
    playThud()
    onUpdateGame(makeMove(game, position))
  }

  const handleCpuMove = () => {
    if (game.currentPlayer !== 'O') return
    if (game.winner || game.isDraw) return
    const move = getCpuMove(game.board)
    if (!move) return
    playThud()
    onUpdateGame(makeMove(game, move))
  }

  const handleRematch = () => {
    onUpdateGame(createGame())
  }

  useEffect(() => {
    if (!game.winner) {
      lastOutcomeRef.current = null
      return
    }

    if (game.winner === lastOutcomeRef.current) return
    lastOutcomeRef.current = game.winner

    if (game.winner === 'X') {
      playWin()
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
      })
      window.dispatchEvent(
        new CustomEvent('tic-tac-toe:player-win-effects', {
          detail: { confetti: true, sound: 'win' },
        }),
      )
    }

    if (game.winner === 'O') {
      playLose()
    }
  }, [game.winner, playLose, playWin])

  return (
    <section className="game">
      <header className="game__header">
        <p className="game__title">
          Tic <span>Tac</span> Toe
        </p>
        <div className="game__status" aria-label="Matchup">
          <span
            className={`game__status-pill ${
              game.currentPlayer === 'X' ? 'game__status-pill--active' : ''
            }`}
          >
            <span className="game__status-letter">X</span>
            <span className="game__status-role">You</span>
          </span>
          <span className="game__status-divider">VS</span>
          <span
            className={`game__status-pill ${
              game.currentPlayer === 'O' ? 'game__status-pill--active' : ''
            }`}
          >
            <span className="game__status-letter">O</span>
            <span className="game__status-role">CPU</span>
          </span>
        </div>
        <p className="game__subtitle">{status}</p>
      </header>

      <Board board={game.board} canPlayAt={canPlayAt} onSelect={handleSelect} />

      <div className="game__actions">
        <button className="btn btn--ghost" onClick={handleRematch}>
          <span className="btn__icon" aria-hidden="true">
            ↻
          </span>
          Play Again
        </button>
        <button className="btn btn--ghost" onClick={onQuit}>
          <span className="btn__icon" aria-hidden="true">
            ⌂
          </span>
          Home
        </button>
        <button
          className="btn btn--ghost btn--inline"
          onClick={handleCpuMove}
          disabled={game.currentPlayer !== 'O' || game.winner !== null || game.isDraw}
        >
          CPU Move
        </button>
      </div>
    </section>
  )
}

export default GamePage
