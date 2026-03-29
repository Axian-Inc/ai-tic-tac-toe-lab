import { createWebSocketDisconnectHandler } from '../../websocket/handlers.js';
import { getRepositories } from '../runtime.js';

const { connectionsRepository } = getRepositories();
const handlerInstance = createWebSocketDisconnectHandler(connectionsRepository);

export const handler = handlerInstance;
