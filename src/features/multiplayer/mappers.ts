import type { MultiplayerGameState } from '../../../shared/contracts';
import type { GameState } from '../game/model';
import { createGameState } from '../game/model';

export function toRenderableGameState(game: MultiplayerGameState): GameState {
  return createGameState(game.moves.map((move) => move.position));
}

export function getLocalPlayer(game: MultiplayerGameState, sessionId: string): 'X' | 'O' | null {
  if (game.players.host.sessionId === sessionId) {
    return 'X';
  }

  if (game.players.guest?.sessionId === sessionId) {
    return 'O';
  }

  return null;
}
