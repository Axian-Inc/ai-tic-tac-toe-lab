import type { CSSProperties } from 'react';
import styles from './GameUi.module.css';

interface ConfettiOverlayProps {
  burst: number;
}

const PIECES = Array.from({ length: 18 }, (_, index) => index);

export function ConfettiOverlay({ burst }: ConfettiOverlayProps) {
  if (burst === 0) {
    return null;
  }

  return (
    <div key={burst} className={styles.confettiLayer} aria-hidden="true">
      {PIECES.map((piece) => (
        <span
          key={`${burst}-${piece}`}
          className={styles.confettiPiece}
          style={
            {
              '--confetti-delay': `${(piece % 6) * 55}ms`,
              '--confetti-duration': `${2200 + (piece % 5) * 180}ms`,
              '--confetti-left': `${4 + piece * 5.2}%`,
              '--confetti-rotate': `${(piece % 2 === 0 ? 1 : -1) * (14 + piece * 3)}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
