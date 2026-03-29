import { createAbandonmentCheckHandler } from '../../http/handlers.js';
import { getHttpDependencies, getRepositories } from '../runtime.js';

const { gamesRepository, gameEventsRepository } = getRepositories();
const handlerInstance = createAbandonmentCheckHandler(
  gamesRepository,
  gameEventsRepository,
  getHttpDependencies(),
);

export const handler = handlerInstance;
