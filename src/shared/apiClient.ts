import type { z } from 'zod';

import { GameStateSchema } from './gameState';
import { ErrorResponseSchema, MoveRequestSchema, MoveResponseSchema } from './moveSchemas';
import { NewGameRequestSchema } from './newGameSchemas';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type ApiError = {
  errorCode: string;
  message: string;
  details?: unknown;
};

export type ApiClient = {
  newGame: (
    request: z.infer<typeof NewGameRequestSchema>,
  ) => Promise<ApiResult<z.infer<typeof GameStateSchema>>>;
  move: (
    request: z.infer<typeof MoveRequestSchema>,
  ) => Promise<ApiResult<z.infer<typeof MoveResponseSchema>>>;
};

type ClientOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
};

const INVALID_RESPONSE: ApiError = {
  errorCode: 'INVALID_RESPONSE',
  message: 'Invalid response from server.',
};

const INVALID_REQUEST: ApiError = {
  errorCode: 'INVALID_INPUT',
  message: 'Request failed local validation.',
};

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      errorCode: 'INVALID_JSON',
      message: 'Response was not valid JSON.',
      details: String(error),
    };
  }
};

const parseResult = async <T>(
  response: Response,
  schema: z.ZodSchema<T>,
): Promise<ApiResult<T>> => {
  const body = await parseJson(response);

  if (!response.ok) {
    const error = ErrorResponseSchema.safeParse(body);
    if (error.success) {
      return { ok: false, error: error.data };
    }
    return { ok: false, error: INVALID_RESPONSE };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: INVALID_RESPONSE };
  }

  return { ok: true, data: parsed.data };
};

export const createApiClient = ({ baseUrl, fetchFn = fetch }: ClientOptions): ApiClient => {
  const root = baseUrl.replace(/\/$/, '');

  return {
    async newGame(request) {
      const validated = NewGameRequestSchema.safeParse(request);
      if (!validated.success) {
        return { ok: false, error: INVALID_REQUEST };
      }

      const response = await fetchFn(`${root}/v1/new-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validated.data),
      });

      return parseResult(response, GameStateSchema);
    },
    async move(request) {
      const validated = MoveRequestSchema.safeParse(request);
      if (!validated.success) {
        return { ok: false, error: INVALID_REQUEST };
      }

      const response = await fetchFn(`${root}/v1/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validated.data),
      });

      return parseResult(response, MoveResponseSchema);
    },
  };
};
