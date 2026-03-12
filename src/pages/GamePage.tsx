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
    if (!game.winner || game.winner === lastOutcomeRef.current) return
    lastOutcomeRef.current = game.winner

    if (game.winner === 'X') {
      playWin()
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.6 },
      })
    }

    if (game.winner === 'O') {
      playLose()
    }
  }, [game.winner, playLose, playWin])

  return (
    <section className="game">
      <header className="game__header">
        <div>
          <p className="game__eyebrow">Match status</p>
          <h1>{status}</h1>
        </div>
        <div className="game__actions">
          <button
            className="btn"
            onClick={handleCpuMove}
            disabled={game.currentPlayer !== 'O' || game.winner !== null || game.isDraw}
          >
            CPU Move
          </button>
          <button className="btn btn--ghost" onClick={onQuit}>
            Quit
          </button>
        </div>
      </header>

      <Board board={game.board} canPlayAt={canPlayAt} onSelect={handleSelect} />

      {game.winner === 'O' && (
        <div className="game__alert">Try Again</div>
      )}

      <div className="game__footer">
        <div className="game__meta">
          <span>Player: X</span>
          <span>CPU: O</span>
          <span>Moves: {game.moveHistory.length}</span>
        </div>
        <button className="btn btn--primary" onClick={handleRematch}>
          Rematch
        </button>
      </div>
    </section>
  )
}

export default GamePage
