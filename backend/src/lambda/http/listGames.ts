import { createListGamesHandler } from '../../http/handlers.js';
import { getHttpDependencies, getRepositories } from '../runtime.js';

const { gamesRepository, gameEventsRepository } = getRepositories();
const handlerInstance = createListGamesHandler(gamesRepository, gameEventsRepository, getHttpDependencies());

export const handler = handlerInstance;
