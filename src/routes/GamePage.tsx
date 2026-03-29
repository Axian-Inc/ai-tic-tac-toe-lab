import { Link, useSearchParams, useParams } from 'react-router-dom';
import { ActionBar } from '../components/ActionBar';
import { ConfettiOverlay } from '../components/ConfettiOverlay';
import { GameBoard } from '../components/GameBoard';
import { GameStatus } from '../components/GameStatus';
import styles from '../components/GameUi.module.css';
import { useTicTacToe } from '../hooks/useTicTacToe';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';

function CpuGamePage() {
  const { confettiBurst, gameState, isCpuThinking, playTurn, resetGame } = useTicTacToe('cpu');

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-label="Tic Tac Toe game detail">
        <ConfettiOverlay burst={confettiBurst} />
        <GameStatus gameState={gameState} isCpuThinking={isCpuThinking} />
        <GameBoard
          board={gameState.board}
          legalMoves={gameState.legalMoves}
          isGameOver={gameState.isGameOver}
          isCpuThinking={isCpuThinking}
          onSelectSquare={playTurn}
        />
        <ActionBar onPlayAgain={resetGame} />
      </section>
    </main>
  );
}

function MultiplayerGamePage({ gameId, joinIntent }: { gameId: string; joinIntent: boolean }) {
  const {
    activeMark,
    abandonmentCountdown,
    canReplay,
    connectionStatus,
    copiedLink,
    errorMessage,
    game,
    gameUrl,
    isReplayActive,
    isJoiningAvailable,
    isLoading,
    isSubmitting,
    joinPlayerName,
    legalMoves,
    participant,
    playTurn,
    replayGame,
    refreshGame,
    resign,
    copyShareLink,
    joinAsPlayer,
    setJoinPlayerName,
    statusHint,
    statusMessage,
  } = useMultiplayerGame(gameId, joinIntent);

  const highlightX = activeMark === 'X' && game?.status !== 'over';
  const highlightO = activeMark === 'O' && game?.status !== 'over';
  const displayGameName = game?.gameName ?? 'Multiplayer Game';
  const displayPlayerX = game?.xPlayerName
    ? participant?.mark === 'X'
      ? `${game.xPlayerName} (You)`
      : game.xPlayerName
    : 'Player X';
  const displayPlayerO = game?.oPlayerName
    ? participant?.mark === 'O'
      ? `${game.oPlayerName} (You)`
      : game.oPlayerName
    : 'Waiting for O';
  const statusToneClassName =
    game?.winner === participant?.mark
      ? styles.statusWin
      : game?.winner && participant && game.winner !== participant.mark
        ? styles.statusLoss
        : game?.terminalReason === 'draw'
          ? styles.statusDraw
          : '';

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-label="Multiplayer Tic Tac Toe game detail">
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.heading}>Tic Tac Toe</h1>
            <div className={styles.matchup} aria-label="Matchup indicator">
              <div className={`${styles.playerBadge} ${highlightX ? styles.playerBadgeActiveX : ''}`}>
                <span className={`${styles.playerMark} ${styles.playerMarkX}`}>X</span>
                <span className={styles.playerText}>{displayPlayerX}</span>
              </div>
              <div className={styles.versus}>
                <span className={styles.versusTop}>VS</span>
                <span className={styles.versusBottom}>
                  {connectionStatus === 'connected' ? 'Live Match' : 'Syncing'}
                </span>
              </div>
              <div className={`${styles.playerBadge} ${highlightO ? styles.playerBadgeActiveO : ''}`}>
                <span className={`${styles.playerMark} ${styles.playerMarkO}`}>O</span>
                <span className={styles.playerText}>{displayPlayerO}</span>
              </div>
            </div>
          </div>
          <div className={`${styles.statusCard} ${statusToneClassName}`}>
            <p className={styles.statusMessage}>{isLoading ? 'Loading multiplayer game...' : statusMessage}</p>
            {statusHint ? <p className={styles.statusHint}>{statusHint}</p> : null}
            {errorMessage ? <p className={styles.statusHint}>{errorMessage}</p> : null}
            {abandonmentCountdown ? (
              <p className={styles.statusTimer} aria-label="Abandonment countdown">
                {abandonmentCountdown}
              </p>
            ) : null}
            <div className={styles.metaGrid}>
              <span className={styles.metaPill}>{displayGameName}</span>
              <span className={styles.metaPill}>Socket {connectionStatus}</span>
              {copiedLink ? <span className={styles.metaPill}>Link copied</span> : null}
            </div>
          </div>
        </header>

        {game ? (
          <GameBoard
            board={game.board}
            legalMoves={legalMoves}
            isGameOver={game.status === 'over'}
            isCpuThinking={isLoading || isSubmitting}
            onSelectSquare={playTurn}
          />
        ) : null}

        <nav className={styles.actionBar} aria-label="Multiplayer game actions">
          {isJoiningAvailable ? (
            <>
              <input
                className={styles.actionInput}
                name="joinPlayerName"
                placeholder="Your name"
                value={joinPlayerName}
                onChange={(event) => setJoinPlayerName(event.target.value)}
                autoComplete="off"
              />
              <button className={styles.actionButton} type="button" onClick={joinAsPlayer} disabled={isSubmitting}>
                {isSubmitting ? 'Joining...' : 'Join Game'}
              </button>
            </>
          ) : null}
          {participant && game?.status === 'active' ? (
            <button className={styles.actionButton} type="button" onClick={resign} disabled={isSubmitting}>
              Resign
            </button>
          ) : null}
          {canReplay ? (
            <button className={styles.actionButton} type="button" onClick={replayGame} disabled={isReplayActive}>
              {isReplayActive ? 'Replaying...' : 'Replay'}
            </button>
          ) : null}
          <button className={styles.actionButton} type="button" onClick={() => void refreshGame()}>
            Refresh
          </button>
          <button className={styles.actionButton} type="button" onClick={copyShareLink}>
            Copy Link
          </button>
          <Link className={styles.actionButton} to={gameUrl}>
            Open Link
          </Link>
          <Link className={styles.actionButton} to="/">
            Home
          </Link>
        </nav>
      </section>
    </main>
  );
}

export function GamePage() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();

  if (!gameId || gameId === 'cpu') {
    return <CpuGamePage />;
  }

  return <MultiplayerGamePage gameId={gameId} joinIntent={searchParams.get('join') === '1'} />;
}
