import type { Player } from './api';

const GAME_ID_KEY = 'ttt_game_id';
const PLAYER_ID_KEY = 'ttt_player_id';
const PLAYER_SYMBOL_KEY = 'ttt_player_symbol';

export type GameSession = {
  gameId: string;
  playerId: string;
  symbol: Player;
};

export function readGameSession(): GameSession | null {
  const gameId = window.sessionStorage.getItem(GAME_ID_KEY);
  const playerId = window.sessionStorage.getItem(PLAYER_ID_KEY);
  const symbol = window.sessionStorage.getItem(PLAYER_SYMBOL_KEY);

  if (!gameId || !playerId || (symbol !== 'X' && symbol !== 'O')) {
    return null;
  }

  return { gameId, playerId, symbol };
}

export function writeGameSession(session: GameSession): void {
  window.sessionStorage.setItem(GAME_ID_KEY, session.gameId);
  window.sessionStorage.setItem(PLAYER_ID_KEY, session.playerId);
  window.sessionStorage.setItem(PLAYER_SYMBOL_KEY, session.symbol);
}

export function clearGameSession(): void {
  window.sessionStorage.removeItem(GAME_ID_KEY);
  window.sessionStorage.removeItem(PLAYER_ID_KEY);
  window.sessionStorage.removeItem(PLAYER_SYMBOL_KEY);
}
