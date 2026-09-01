import type { Mark } from './contract-fixtures.js';

export const abandonmentBoundaryScenarios = [
  {
    id: 'P2-ABANDON-001a',
    elapsedMilliseconds: 179_999,
    claimant: 'X' as Mark,
    currentTurn: 'O' as Mark,
    expected: 'abandonment_not_due',
  },
  {
    id: 'P2-ABANDON-001b',
    elapsedMilliseconds: 180_000,
    claimant: 'X' as Mark,
    currentTurn: 'O' as Mark,
    expected: 'game.abandoned',
  },
] as const;

export const controlledClockScenarioInventory = [
  ...abandonmentBoundaryScenarios,
  { id: 'P2-ABANDON-002', action: 'repeat-identical-command', expected: 'exact-receipt-and-one-event' },
  { id: 'P2-ABANDON-003', action: 'concurrent-probes', expected: 'one-winning-transaction' },
  { id: 'P2-ABANDON-004', action: 'accepted-move-resets-turn-start', expected: 'new-eligible-at' },
  { id: 'P2-ABANDON-005', action: 'claimant-probes-on-own-turn', expected: 'not_opponent_turn' },
  { id: 'P2-ABANDON-006', action: 'waiting-or-over-game-probe', expected: 'game_not_active-or-game_over' },
] as const;

export const capacityScenarioInventory = [
  {
    id: 'P2-CAP-001',
    participants: 26,
    expectedAccepted: 25,
    expectedRejected: 1,
    expectedRejection: { status: 429, code: 'capacity_exhausted', retryAfter: 5 },
  },
  { id: 'P2-CAP-002', action: 'cancel-one-waiting-game-then-retry', expected: 'exactly-one-new-create-succeeds' },
  { id: 'P2-CAP-003', action: 'concurrent-terminal-transitions', expected: 'capacity-released-once' },
] as const;
