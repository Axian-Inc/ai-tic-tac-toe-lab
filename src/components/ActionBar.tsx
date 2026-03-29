import { Link } from 'react-router-dom';
import styles from './GameUi.module.css';

interface ActionBarProps {
  onPlayAgain: () => void;
}

export function ActionBar({ onPlayAgain }: ActionBarProps) {
  return (
    <nav className={styles.actionBar} aria-label="Game actions">
      <button className={styles.actionButton} type="button" onClick={onPlayAgain}>
        Play Again
      </button>
      <Link className={styles.actionButton} to="/">
        Home
      </Link>
    </nav>
  );
}
