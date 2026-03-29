import { createWebSocketConnectHandler } from '../../websocket/handlers.js';
import { getRepositories } from '../runtime.js';

const { connectionsRepository } = getRepositories();
const handlerInstance = createWebSocketConnectHandler(connectionsRepository);

export const handler = handlerInstance;
