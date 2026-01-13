import { z } from 'zod';

import { GameStateSchema } from './gameState';

export const MoveRequestSchema = z.object({
  state: GameStateSchema,
  playerMoveIndex: z.number().int().min(0).max(8),
});

export const MoveResponseSchema = z.object({
  state: GameStateSchema,
  aiRationale: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  errorCode: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type MoveRequest = z.infer<typeof MoveRequestSchema>;
export type MoveResponse = z.infer<typeof MoveResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
