import { createResignGameHandler } from '../../http/handlers.js';
import { getHttpDependencies, getRepositories } from '../runtime.js';

const { gamesRepository, gameEventsRepository } = getRepositories();
const handlerInstance = createResignGameHandler(
  gamesRepository,
  gameEventsRepository,
  getHttpDependencies(),
);

export const handler = handlerInstance;
