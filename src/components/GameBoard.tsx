import styles from './GameUi.module.css';
import { Square } from './Square';
import type { Board as BoardState } from '../game/types';

interface GameBoardProps {
  board: BoardState;
  legalMoves: number[];
  isGameOver: boolean;
  isCpuThinking: boolean;
  onSelectSquare: (index: number) => void;
}

export function GameBoard({
  board,
  legalMoves,
  isGameOver,
  isCpuThinking,
  onSelectSquare,
}: GameBoardProps) {
  const legalMoveSet = new Set(legalMoves);

  return (
    <section className={styles.boardShell} aria-label="Game board section">
      <div className={styles.board} aria-label="Tic Tac Toe board">
        {board.map((square, index) => (
          <Square
            key={index}
            index={index}
            value={square}
            disabled={!legalMoveSet.has(index) || isGameOver || isCpuThinking}
            onSelect={onSelectSquare}
          />
        ))}
      </div>
    </section>
  );
}
