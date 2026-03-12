import type { Cell } from '../game'

type SquareProps = {
  value: Cell
  onClick: () => void
  isInteractive: boolean
  position: {
    row: number
    col: number
  }
}

const Square = ({ value, onClick, isInteractive, position }: SquareProps) => {
  const classes = ['square']
  if (isInteractive) classes.push('square--interactive')
  if (value === 'X') classes.push('square--x')
  if (value === 'O') classes.push('square--o')

  return (
    <button
      className={classes.join(' ')}
      onClick={onClick}
      disabled={!isInteractive}
      type="button"
      aria-label={value ? `Square ${value}` : 'Empty square'}
      data-testid={`square-${position.row}-${position.col}`}
    >
      {value ?? ''}
    </button>
  )
}

export default Square
