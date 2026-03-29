import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react';
import { calculateLegalMoves, createEmptyBoard } from '../../shared/ticTacToe';
import type { Board, Player } from '../game/types';
import {
  MultiplayerApiError,
  checkAbandonment,
  createGameUrl,
  createMultiplayerWebSocketUrl,
  getGame,
  joinGame,
  resignMultiplayerGame,
  spectateGame,
  submitMove,
} from '../multiplayer/api';
import { loadParticipantSession, saveParticipantSession } from '../multiplayer/storage';
import type { MultiplayerGameDetailsResponse, MultiplayerGameSnapshot, ParticipantSession } from '../multiplayer/types';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'offline';
type ReplayMove = {
  mark: Player;
  position: number;
};

const ABANDONMENT_TIMEOUT_MS = 3 * 60 * 1000;

function getStatusMessage(
  game: MultiplayerGameSnapshot | null,
  participant: ParticipantSession | null,
  isSubmitting: boolean,
  connectionStatus: ConnectionStatus,
) {
  if (!game) {
    return 'Loading multiplayer game...';
  }

  if (isSubmitting) {
    return 'Sending your move to the server...';
  }

  if (game.status === 'waiting') {
    return participant
      ? 'Game created. Share the link and wait for another player to join.'
      : 'This game is waiting for a second player. Join to start the match.';
  }

  if (game.status === 'over') {
    if (game.terminalReason === 'draw') {
      return "This match ended in a draw.";
    }

    if (participant && game.winner === participant.mark) {
      return game.terminalReason === 'abandonment'
        ? 'You win by abandonment.'
        : 'You win this multiplayer round.';
    }

    if (participant && game.winner && game.winner !== participant.mark) {
      return game.terminalReason === 'abandonment'
        ? 'You lose by abandonment.'
        : 'You lost this multiplayer round.';
    }

    return game.terminalReason === 'abandonment'
      ? `Game over by abandonment. ${game.winner ?? 'No one'} wins.`
      : `Game over. ${game.winner ?? 'No one'} wins.`;
  }

  if (!participant) {
    return connectionStatus === 'connected'
      ? 'Watching live. Waiting for the next move...'
      : 'Spectating game state. Live updates will resume once connected.';
  }

  if (game.nextMark === participant.mark) {
    return 'Your turn. Pick an open square.';
  }

  return connectionStatus === 'connected'
    ? 'Waiting for the remote player to move...'
    : 'Reconnecting to live updates...';
}

function getStatusHint(game: MultiplayerGameSnapshot | null, participant: ParticipantSession | null) {
  if (!game) {
    return null;
  }

  if (game.status === 'waiting' && participant?.mark === 'X') {
    return 'Send the game link to another player so they can join as O.';
  }

  if (game.status === 'over' && game.terminalReason === 'abandonment') {
    return 'This result is recorded separately from a normal finished win/loss.';
  }

  return null;
}

function getLegalMovesForPlayer(game: MultiplayerGameSnapshot | null, participant: ParticipantSession | null) {
  if (!game || game.status !== 'active' || !participant || game.nextMark !== participant.mark) {
    return [];
  }

  return calculateLegalMoves(game.board as Board);
}

function getTurnDeadline(game: MultiplayerGameSnapshot | null) {
  if (!game || game.status !== 'active') {
    return null;
  }

  const turnStartedAt = game.lastMoveAt ?? game.startedAt ?? game.updatedAt;

  if (!turnStartedAt) {
    return null;
  }

  return Date.parse(turnStartedAt) + ABANDONMENT_TIMEOUT_MS;
}

function formatCountdown(millisecondsRemaining: number) {
  const totalSeconds = Math.max(0, Math.ceil(millisecondsRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getReplayMoves(detailsEvents: MultiplayerGameDetailsResponse['events']): ReplayMove[] {
  return detailsEvents.flatMap((event) => {
    if (event.eventType !== 'move_accepted') {
      return [];
    }

    const mark = event.payload.mark;
    const position = event.payload.position;

    if ((mark !== 'X' && mark !== 'O') || typeof position !== 'number') {
      return [];
    }

    return [{ mark, position }];
  });
}

function loadInitialParticipant(gameId: string, joinIntent: boolean) {
  const storedParticipant = loadParticipantSession(gameId);

  if (joinIntent) {
    return null;
  }

  return storedParticipant;
}

export function useMultiplayerGame(gameId: string, joinIntent = false) {
  const [game, setGame] = useState<MultiplayerGameSnapshot | null>(null);
  const [events, setEvents] = useState<MultiplayerGameDetailsResponse['events']>([]);
  const [participant, setParticipant] = useState<ParticipantSession | null>(() =>
    loadInitialParticipant(gameId, joinIntent),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [replayMoveCount, setReplayMoveCount] = useState(0);
  const [replayTargetMoveCount, setReplayTargetMoveCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [joinPlayerName, setJoinPlayerName] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const replayInitializedRef = useRef(false);

  function clearReconnectTimeout() {
    if (typeof window === 'undefined' || reconnectTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }

  function closeCurrentSocket() {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    socketRef.current = null;
    socket.close();
  }

  function scheduleReconnect() {
    if (typeof window === 'undefined') {
      return;
    }

    clearReconnectTimeout();
    reconnectTimeoutRef.current = window.setTimeout(() => {
      startTransition(() => {
        setConnectionAttempt((attempt) => attempt + 1);
      });
    }, 1500);
  }

  const refreshGame = useEffectEvent(async () => {
    const details = await getGame(gameId);
    setGame(details.game);
    setEvents(details.events);
    return details;
  });

  useEffect(() => {
    setParticipant(loadInitialParticipant(gameId, joinIntent));
    setCopiedLink(false);
    setEvents([]);
    setIsReplayActive(false);
    setReplayMoveCount(0);
    setReplayTargetMoveCount(0);
    setJoinPlayerName('');
    replayInitializedRef.current = false;
  }, [gameId, joinIntent]);

  const replayMoves = getReplayMoves(events);

  function startReplay(targetMoveCount = replayMoves.length) {
    if (!game || (game.status !== 'active' && game.status !== 'over') || targetMoveCount <= 0) {
      return false;
    }

    setReplayTargetMoveCount(targetMoveCount);
    setReplayMoveCount(0);
    setIsReplayActive(true);
    return true;
  }

  useEffect(() => {
    if (!game || replayInitializedRef.current) {
      return;
    }

    replayInitializedRef.current = true;
    void startReplay();
  }, [game, replayMoves.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isReplayActive) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setReplayMoveCount((currentCount) => {
        if (currentCount >= replayTargetMoveCount) {
          return currentCount;
        }

        return currentCount + 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isReplayActive, replayTargetMoveCount]);

  useEffect(() => {
    if (!isReplayActive || replayMoveCount < replayTargetMoveCount) {
      return;
    }

    setIsReplayActive(false);
  }, [isReplayActive, replayMoveCount, replayTargetMoveCount]);

  useEffect(() => {
    if (typeof window === 'undefined' || isReplayActive || game?.status !== 'active') {
      return;
    }

    setCountdownNow(Date.now());

    const intervalId = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [game?.status, game?.lastMoveAt, game?.startedAt, game?.updatedAt, isReplayActive]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await refreshGame();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof MultiplayerApiError
              ? error.message
              : 'Unable to load multiplayer game.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  useEffect(() => {
    if (typeof window === 'undefined' || game?.status !== 'active') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshGame().catch(() => {
        setConnectionStatus('offline');
      });
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [game?.status, gameId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!participant && !game) {
      setConnectionStatus('idle');
      return;
    }

    if (game?.status === 'over') {
      clearReconnectTimeout();
      closeCurrentSocket();
      setConnectionStatus('idle');
      return;
    }

    let cancelled = false;

    async function openSocket() {
      clearReconnectTimeout();
      closeCurrentSocket();
      setConnectionStatus('connecting');

      let participantType: 'player' | 'spectator' = 'spectator';
      let participantId = 'anonymous';

      if (participant) {
        participantType = 'player';
        participantId = participant.playerId;
      } else {
        try {
          const spectateResponse = await spectateGame(gameId);
          participantId = spectateResponse.spectator.spectatorId;
        } catch {
          participantId = 'anonymous';
        }
      }

      if (cancelled) {
        return;
      }

      const socket = new WebSocket(
        createMultiplayerWebSocketUrl(gameId, participantType, participantId),
      );
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled || socket !== socketRef.current) {
          return;
        }

        setConnectionStatus('connected');
      };

      socket.onmessage = () => {
        if (cancelled || socket !== socketRef.current) {
          return;
        }

        void refreshGame().catch(() => {
          setConnectionStatus('offline');
        });
      };

      socket.onclose = () => {
        if (cancelled || socket !== socketRef.current) {
          return;
        }

        socketRef.current = null;
        setConnectionStatus('offline');
        scheduleReconnect();
      };

      socket.onerror = () => {
        if (cancelled || socket !== socketRef.current) {
          return;
        }

        setConnectionStatus('offline');
      };
    }

    void openSocket();

    return () => {
      cancelled = true;
      clearReconnectTimeout();
      closeCurrentSocket();
    };
  }, [connectionAttempt, game?.status, gameId, participant?.mark, participant?.playerId]);

  async function joinAsPlayer() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextJoinPlayerName = joinPlayerName.trim();

      if (!nextJoinPlayerName) {
        throw new MultiplayerApiError(
          'invalid_request',
          'Enter your name before joining this game.',
          400,
        );
      }

      const response = await joinGame(gameId, nextJoinPlayerName);
      const nextParticipant = {
        playerId: response.participant.playerId,
        mark: response.participant.mark,
      } as ParticipantSession;
      saveParticipantSession(gameId, nextParticipant);
      setParticipant(nextParticipant);
      setConnectionAttempt(0);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', createGameUrl(gameId));
      }
      await refreshGame();
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to join the multiplayer game.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function playTurn(index: number) {
    if (!participant || isSubmitting || isReplayActive) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitMove(gameId, participant.playerId, index);
      setGame(response.game);
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to submit the move.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resign() {
    if (!participant || isSubmitting || isReplayActive) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await resignMultiplayerGame(gameId, participant.playerId);
      setGame(response.game);
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to resign the multiplayer game.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestAbandonmentCheck() {
    if (!participant || isSubmitting || isReplayActive) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await checkAbandonment(gameId, participant.playerId);
      setGame(response.game);
    } catch (error) {
      setErrorMessage(
        error instanceof MultiplayerApiError
          ? error.message
          : 'Unable to check for abandonment.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyShareLink() {
    const gameUrl = createGameUrl(gameId, 'join');

    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1200);
    } catch {
      setErrorMessage('Unable to copy the game link from this browser.');
    }
  }

  let displayedGame = game;

  if (game && isReplayActive) {
    const replayBoard = createEmptyBoard() as Board;
    const visibleReplayMoveCount = Math.min(replayMoveCount, replayTargetMoveCount);

    for (const move of replayMoves.slice(0, visibleReplayMoveCount)) {
      replayBoard[move.position] = move.mark;
    }

    displayedGame = {
      ...game,
      board: replayBoard,
      moveCount: visibleReplayMoveCount,
      nextMark: visibleReplayMoveCount < replayTargetMoveCount ? replayMoves[visibleReplayMoveCount]?.mark ?? null : null,
      status: visibleReplayMoveCount < replayTargetMoveCount ? 'active' : game.status,
      winner: visibleReplayMoveCount < replayTargetMoveCount ? null : game.winner,
      terminalReason: visibleReplayMoveCount < replayTargetMoveCount ? null : game.terminalReason,
    };
  }

  const legalMoves = isReplayActive ? [] : getLegalMovesForPlayer(displayedGame, participant);
  const activeMark =
    displayedGame?.status === 'over'
      ? displayedGame.winner
      : displayedGame?.nextMark;

  const pendingReplaySyncCount = isReplayActive
    ? Math.max(0, replayMoves.length - replayTargetMoveCount)
    : 0;
  const statusMessage = isReplayActive && game
    ? replayMoveCount < replayTargetMoveCount
      ? `Replay move ${replayMoveCount + 1} of ${replayTargetMoveCount}. ${replayMoves[replayMoveCount]?.mark ?? 'X'} to play.`
      : game.status === 'over'
        ? game.terminalReason === 'draw'
          ? 'Replay complete. This game ended in a draw.'
          : `Replay complete. ${game.winner ?? 'No one'} wins.`
        : 'Replay complete. Returning to live play.'
    : getStatusMessage(displayedGame, participant, isSubmitting, connectionStatus);
  const turnDeadline = isReplayActive ? null : getTurnDeadline(displayedGame);
  const abandonmentCountdown = turnDeadline === null
    ? null
    : `Abandon in ${formatCountdown(turnDeadline - countdownNow)}`;
  const statusHint = isReplayActive
    ? pendingReplaySyncCount > 0
      ? `${pendingReplaySyncCount} new ${pendingReplaySyncCount === 1 ? 'move has' : 'moves have'} arrived. Syncing to live state next.`
      : game?.status === 'active'
        ? 'Replay catches up to the latest known move, then live play resumes.'
        : 'Replay advances every 1 second.'
    : getStatusHint(displayedGame, participant);
  const canReplay = replayMoves.length > 0 && (game?.status === 'active' || game?.status === 'over');

  return {
    activeMark,
    abandonmentCountdown,
    canReplay,
    connectionStatus,
    copiedLink,
    errorMessage,
    game: displayedGame,
    gameUrl: createGameUrl(gameId),
    isReplayActive,
    joinPlayerName,
    setJoinPlayerName,
    isJoiningAvailable: game?.status === 'waiting' && !participant,
    isLoading,
    isSubmitting,
    legalMoves,
    participant,
    playTurn,
    replayGame: () => {
      void startReplay();
    },
    refreshGame,
    requestAbandonmentCheck,
    resign,
    copyShareLink,
    joinAsPlayer,
    statusHint,
    statusMessage,
  };
}
