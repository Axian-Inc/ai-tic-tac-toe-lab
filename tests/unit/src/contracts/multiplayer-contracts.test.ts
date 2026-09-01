import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  eventFixture,
  isGameEvent,
  isRecord,
  isSnapshot,
  seatSessionFixture,
  waitingGameFixture,
} from '../multiplayer/contract-fixtures.js';

const repositoryRoot = new URL('../../../../', import.meta.url);

async function contract(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, repositoryRoot), 'utf8');
}

function jsonFences(markdown: string): unknown[] {
  return [...markdown.matchAll(/```json\s*([\s\S]*?)```/g)].map((match) => JSON.parse(match[1]));
}

describe('Phase 2 frozen contracts', () => {
  it('P2-CONTRACT-HTTP-001: freezes every required HTTP operation and security boundary', async () => {
    const source = await contract('contracts/openapi.yaml');
    const requiredFragments = [
      'version: 1.0.0',
      '/api/v1/games:',
      '/api/v1/games/{gameId}:',
      '/api/v1/games/{gameId}/events:',
      '/api/v1/games/{gameId}/join:',
      '/api/v1/games/{gameId}/moves:',
      '/api/v1/games/{gameId}/resign:',
      '/api/v1/games/{gameId}/abandonment-check:',
      'operationId: createGame',
      'operationId: listGames',
      'operationId: getGame',
      'operationId: getGameEvents',
      'operationId: joinGame',
      'operationId: makeMove',
      'operationId: resignGame',
      'operationId: checkAbandonment',
      'PlayerCapability:',
      'bearerFormat: opaque-game-seat-capability',
      "'429':",
      'const: 5',
    ];
    for (const fragment of requiredFragments) expect(source).toContain(fragment);
  });

  it('P2-CONTRACT-HTTP-002: canonical fixtures obey snapshot, event, and secret boundaries', () => {
    const snapshot = waitingGameFixture();
    const event = eventFixture(snapshot);
    const session = seatSessionFixture();

    expect(isSnapshot(snapshot)).toBe(true);
    expect(isGameEvent(event)).toBe(true);
    expect(session.seatToken.length).toBeGreaterThanOrEqual(32);
    expect(snapshot).not.toHaveProperty('seatToken');
    expect(event).not.toHaveProperty('seatToken');
    expect(event.state).not.toHaveProperty('seatToken');
  });

  it('P2-CONTRACT-WS-001: parses all WebSocket examples and keeps capabilities out of them', async () => {
    const source = await contract('contracts/websocket-events.md');
    const examples = jsonFences(source);

    expect(examples).toHaveLength(4);
    expect(examples.every(isRecord)).toBe(true);
    expect(examples.map((value) => (isRecord(value) ? value.type ?? value.action : null))).toEqual([
      'subscribe',
      'subscription.accepted',
      'subscription.rejected',
      'game.event',
    ]);
    for (const example of examples) expect(JSON.stringify(example)).not.toContain('seatToken');
  });

  it('P2-CONTRACT-WS-002: freezes catch-up ordering and rejection vocabulary', async () => {
    const source = await contract('contracts/websocket-events.md');
    for (const fragment of [
      'Delivery is at least once.',
      'throughSequence',
      'ignore an event whose sequence is already applied',
      'apply only the next contiguous sequence',
      'buffer a future sequence',
      'invalid_message',
      'unsupported_version',
      'game_not_found',
      'invalid_cursor',
    ]) {
      expect(source).toContain(fragment);
    }
  });

  it('P2-CONTRACT-DOMAIN-001: freezes concurrency, idempotency, time, and capacity semantics', async () => {
    const source = await contract('contracts/multiplayer-domain.md');
    for (const fragment of [
      'Receipt lookup happens before sequence validation.',
      'Sequence is per game, starts at `1`, and never repeats.',
      'Each later accepted command persists exactly one event',
      'greater than or equal to `turnStartedAt + 180 seconds`',
      'Waiting and active games both consume one of 25 capacity slots.',
      'Count-then-create is forbidden.',
      'HTTP 429 `capacity_exhausted` and `Retry-After: 5`',
      'All timestamps are RFC 3339 UTC with millisecond precision.',
      'applies only contiguous server sequences',
    ]) {
      expect(source).toContain(fragment);
    }
  });
});
