import styles from './GameUi.module.css';
import type { CellValue } from '../game/types';

interface SquareProps {
  index: number;
  value: CellValue;
  disabled: boolean;
  onSelect: (index: number) => void;
}

export function Square({ index, value, disabled, onSelect }: SquareProps) {
  const markClassName = value === 'X' ? styles.squareMarkX : value === 'O' ? styles.squareMarkO : '';

  return (
    <button
      className={styles.square}
      type="button"
      disabled={disabled}
      onClick={() => onSelect(index)}
      aria-label={`Square ${index + 1}`}
    >
      <span className={`${styles.squareMark} ${markClassName}`}>{value ?? ''}</span>
    </button>
  );
}
