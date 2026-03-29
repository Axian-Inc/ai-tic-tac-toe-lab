import { createPostMoveHandler } from '../../http/handlers.js';
import { getHttpDependencies, getRepositories } from '../runtime.js';

const { gamesRepository, gameEventsRepository } = getRepositories();
const handlerInstance = createPostMoveHandler(
  gamesRepository,
  gameEventsRepository,
  getHttpDependencies(),
);

export const handler = handlerInstance;
