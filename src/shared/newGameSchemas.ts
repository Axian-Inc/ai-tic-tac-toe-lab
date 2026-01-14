import { z } from 'zod';

const playerSymbol = z.enum(['X', 'O']);

export const NewGameRequestSchema = z.object({
  startingPlayer: playerSymbol,
  opponentId: z.string().min(1),
});

export type NewGameRequest = z.infer<typeof NewGameRequestSchema>;
