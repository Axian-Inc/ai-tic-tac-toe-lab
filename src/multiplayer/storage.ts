import type { ParticipantSession } from './types';

const STORAGE_KEY_PREFIX = 'tic-tac-toe-lab:multiplayer:';

function getStorageKey(gameId: string) {
  return `${STORAGE_KEY_PREFIX}${gameId}`;
}

export function loadParticipantSession(gameId: string): ParticipantSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getStorageKey(gameId));

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as ParticipantSession;

    if (
      typeof parsedValue.playerId !== 'string' ||
      (parsedValue.mark !== 'X' && parsedValue.mark !== 'O')
    ) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export function saveParticipantSession(gameId: string, session: ParticipantSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(gameId), JSON.stringify(session));
}

export function clearParticipantSession(gameId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(getStorageKey(gameId));
}
