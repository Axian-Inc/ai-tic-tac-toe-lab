import { createGetGameHandler } from '../../http/handlers.js';
import { getHttpDependencies, getRepositories } from '../runtime.js';

const { gamesRepository, gameEventsRepository } = getRepositories();
const handlerInstance = createGetGameHandler(gamesRepository, gameEventsRepository, getHttpDependencies());

export const handler = handlerInstance;
