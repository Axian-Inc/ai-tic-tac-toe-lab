import { createPostGamesHandler } from '../../http/handlers.js';
import { getHttpDependencies, getRepositories } from '../runtime.js';

const { gamesRepository, gameEventsRepository } = getRepositories();
const handlerInstance = createPostGamesHandler(
  gamesRepository,
  gameEventsRepository,
  getHttpDependencies(),
);

export const handler = handlerInstance;
