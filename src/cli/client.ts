import type { ApiClient, MoveRequest, NewGameRequest } from '../shared';
import { createApiClient } from '../shared';

type CliClientOptions = {
  baseUrl: string;
};

export const createCliClient = ({ baseUrl }: CliClientOptions): ApiClient =>
  createApiClient({ baseUrl });

export const buildNewGameRequest = (
  startingPlayer: NewGameRequest['startingPlayer'],
  opponentId: NewGameRequest['opponentId'],
): NewGameRequest => ({
  startingPlayer,
  opponentId,
});

export const buildMoveRequest = (
  state: MoveRequest['state'],
  playerMoveIndex: MoveRequest['playerMoveIndex'],
): MoveRequest => ({
  state,
  playerMoveIndex,
});
