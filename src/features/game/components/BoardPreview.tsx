import type { Board } from '../model';

interface BoardPreviewProps {
  readonly board: Board;
  readonly highlightCells?: readonly number[];
  readonly interactive?: boolean;
  readonly canSelectCell?: (position: number) => boolean;
  readonly onSelectCell?: (position: number) => void;
  readonly onHoverCell?: (position: number | null) => void;
  readonly selectedCell?: number | null;
}

export function BoardPreview({
  board,
  highlightCells = [],
  interactive = false,
  canSelectCell,
  onSelectCell,
  onHoverCell,
  selectedCell = null,
}: BoardPreviewProps) {
  return (
    <div className="board-preview" aria-label="Static tic tac toe board preview">
      {board.map((cell, index) => {
        const canSelect = canSelectCell ? canSelectCell(index) : false;

        return (
          <button
            aria-label={`Cell ${index}`}
            aria-disabled={interactive && !canSelect}
            className={[
              'board-cell',
              highlightCells.includes(index) ? 'board-cell--highlighted' : '',
              interactive && canSelect ? 'board-cell--interactive' : '',
              selectedCell === index ? 'board-cell--selected' : '',
              interactive && !canSelect ? 'board-cell--blocked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={!interactive}
            key={index}
            onBlur={() => onHoverCell?.(null)}
            onClick={() => onSelectCell?.(index)}
            onMouseEnter={() => onHoverCell?.(index)}
            onMouseLeave={() => onHoverCell?.(null)}
            type="button"
          >
            <span>{cell ?? ''}</span>
          </button>
        );
      })}
    </div>
  );
}
