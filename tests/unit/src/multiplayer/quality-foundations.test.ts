import { describe, expect, it } from 'vitest';
import { requireCapacityDistribution, runAtBarrier, type CapacityAttempt } from './harness.js';
import { abandonmentBoundaryScenarios, capacityScenarioInventory } from './scenarios.js';

describe('Phase 2 quality harness foundations', () => {
  it('P2-HARNESS-CLOCK-001: inventories both sides of the exact abandonment boundary', () => {
    expect(abandonmentBoundaryScenarios).toEqual([
      expect.objectContaining({ elapsedMilliseconds: 179_999, expected: 'abandonment_not_due' }),
      expect.objectContaining({ elapsedMilliseconds: 180_000, expected: 'game.abandoned' }),
    ]);
  });

  it('P2-HARNESS-CAP-001: releases all 26 capacity operations from one barrier', async () => {
    const entered: number[] = [];
    const results = await runAtBarrier(26, async (index) => {
      entered.push(index);
      return index;
    });

    expect(entered).toHaveLength(26);
    expect(results.every(({ status }) => status === 'fulfilled')).toBe(true);
    expect(capacityScenarioInventory[0]).toMatchObject({
      participants: 26,
      expectedAccepted: 25,
      expectedRejected: 1,
    });
  });

  it('P2-HARNESS-CAP-002: rejects a result distribution that does not prove the limit', () => {
    const valid: CapacityAttempt<number>[] = Array.from({ length: 26 }, (_, index) => ({
      index,
      outcome: index === 25 ? 'capacity_exhausted' : 'accepted',
      value: index === 25 ? undefined : index,
    }));
    expect(() => requireCapacityDistribution(valid)).not.toThrow();
    expect(() => requireCapacityDistribution(valid.slice(0, 25))).toThrow(/25 accepted/);
  });
});
