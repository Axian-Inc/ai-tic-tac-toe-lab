import { z } from 'zod';

const playerSymbol = z.enum(['X', 'O']);
const cellValue = z.union([playerSymbol, z.null()]);

const moveHistoryEntry = z.object({
  player: playerSymbol,
  index: z.number().int().min(0).max(8),
});

export const GameStateSchema = z.object({
  board: z.array(cellValue).length(9),
  nextPlayer: playerSymbol,
  gameStatus: z.enum(['in_progress', 'win', 'draw']),
  winner: z.union([playerSymbol, z.null()]),
  opponentId: z.string(),
  sessionId: z.string(),
  moveHistory: z.array(moveHistoryEntry).optional(),
});

export type GameState = z.infer<typeof GameStateSchema>;
