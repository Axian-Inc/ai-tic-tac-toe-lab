import type { Board as BoardType, Position } from '../game'
import Square from './Square'

type BoardProps = {
  board: BoardType
  canPlayAt: (position: Position) => boolean
  onSelect: (position: Position) => void
}

const Board = ({ board, canPlayAt, onSelect }: BoardProps) => {
  return (
    <div className="board" role="grid" aria-label="Tic tac toe board">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const position = { row: rowIndex, col: colIndex }
          const interactive = canPlayAt(position)
          return (
            <Square
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              onClick={() => onSelect(position)}
              isInteractive={interactive}
            />
          )
        }),
      )}
    </div>
  )
}

export default Board
