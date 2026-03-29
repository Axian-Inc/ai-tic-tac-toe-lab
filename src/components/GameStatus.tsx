import styles from './GameUi.module.css';
import type { GameState } from '../game/types';

interface GameStatusProps {
  gameState: GameState;
  isCpuThinking: boolean;
}

function getStatusMessage(gameState: GameState, isCpuThinking: boolean) {
  if (gameState.status === 'draw') {
    return "It's a draw. Tap Play Again for a rematch.";
  }

  if (gameState.winner === 'X') {
    return 'You win. The board is locked until you start again.';
  }

  if (gameState.winner === 'O') {
    return 'CPU wins this round. Shake it off and try again.';
  }

  return isCpuThinking ? 'CPU is thinking...' : 'Your turn. Pick an open tile.';
}

export function GameStatus({ gameState, isCpuThinking }: GameStatusProps) {
  const activePlayer = gameState.status === 'won' ? gameState.winner : gameState.currentPlayer;
  const highlightX = activePlayer === 'X' && gameState.status !== 'draw';
  const highlightO = activePlayer === 'O' && gameState.status !== 'draw';
  const statusToneClassName =
    gameState.winner === 'X'
      ? styles.statusWin
      : gameState.winner === 'O'
        ? styles.statusLoss
        : gameState.status === 'draw'
          ? styles.statusDraw
          : '';

  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <h1 className={styles.heading}>Tic Tac Toe</h1>
        <div className={styles.matchup} aria-label="Matchup indicator">
          <div className={`${styles.playerBadge} ${highlightX ? styles.playerBadgeActiveX : ''}`}>
            <span className={`${styles.playerMark} ${styles.playerMarkX}`}>X</span>
            <span className={styles.playerText}>You</span>
          </div>
          <div className={styles.versus}>
            <span className={styles.versusTop}>VS</span>
            <span className={styles.versusBottom}>CPU Match</span>
          </div>
          <div className={`${styles.playerBadge} ${highlightO ? styles.playerBadgeActiveO : ''}`}>
            <span className={`${styles.playerMark} ${styles.playerMarkO}`}>O</span>
            <span className={styles.playerText}>CPU</span>
          </div>
        </div>
      </div>
      <div className={`${styles.statusCard} ${statusToneClassName}`}>
        <p className={styles.statusMessage}>{getStatusMessage(gameState, isCpuThinking)}</p>
        {gameState.winner === 'O' ? (
          <p className={styles.statusHint}>The CPU found the line. Try a different opening and take the center earlier.</p>
        ) : null}
      </div>
    </header>
  );
}
