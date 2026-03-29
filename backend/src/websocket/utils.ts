import { HttpHandlerError } from '../http/errors.js';
import type { WebSocketRequest, WebSocketResponse } from './types.js';

export function createWebSocketResponse(statusCode: number, body = ''): WebSocketResponse {
  return { statusCode, body };
}

export function createWebSocketErrorResponse(error: unknown): WebSocketResponse {
  if (error instanceof HttpHandlerError) {
    return createWebSocketResponse(
      error.statusCode,
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
        },
      }),
    );
  }

  return createWebSocketResponse(
    500,
    JSON.stringify({
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred.',
      },
    }),
  );
}

export function requireWebSocketQueryParam(request: WebSocketRequest, name: string): string {
  const value = request.queryStringParameters?.[name];

  if (!value) {
    throw new HttpHandlerError(400, 'invalid_request', `Missing query parameter: ${name}.`);
  }

  return value;
}

export function createWebSocketHandler<TRequest extends WebSocketRequest>(
  handler: (request: TRequest) => Promise<WebSocketResponse>,
): (request: TRequest) => Promise<WebSocketResponse> {
  return async (request: TRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return createWebSocketErrorResponse(error);
    }
  };
}
