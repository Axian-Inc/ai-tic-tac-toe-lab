import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = new URL('../../../../', import.meta.url);
const clientFiles = {
  app: new URL('apps/web/src/App.tsx', repositoryRoot),
  environment: new URL('apps/web/src/vite-env.d.ts', repositoryRoot),
  api: new URL('apps/web/src/multiplayer/api.ts', repositoryRoot),
  connection: new URL('apps/web/src/multiplayer/connection.ts', repositoryRoot),
  types: new URL('apps/web/src/multiplayer/types.ts', repositoryRoot),
};
const clientIsIntegrated = existsSync(fileURLToPath(clientFiles.api));

describe.skipIf(!clientIsIntegrated)('Phase 2 client integration seams', () => {
  it('P2-SEAM-CLIENT-001: keeps deployment configuration and sequence evidence observable', async () => {
    const [application, environment] = await Promise.all([
      readFile(clientFiles.app, 'utf8'),
      readFile(clientFiles.environment, 'utf8'),
    ]);

    expect(environment).toContain('VITE_API_BASE_URL');
    expect(environment).toContain('VITE_WS_URL');
    expect(application).toContain('import.meta.env.VITE_API_BASE_URL');
    expect(application).toContain('import.meta.env.VITE_WS_URL');
    expect(application).toContain('data-testid="multiplayer-sequence"');
  });

  it('P2-SEAM-CLIENT-002: exposes separate HTTP, ordered-stream, and data adapters', async () => {
    const [api, connection, types] = await Promise.all([
      readFile(clientFiles.api, 'utf8'),
      readFile(clientFiles.connection, 'utf8'),
      readFile(clientFiles.types, 'utf8'),
    ]);

    expect(api).toContain('export class MultiplayerApi');
    expect(api).toContain("'/games'");
    expect(api).toContain("'/moves'");
    expect(api).toContain('Authorization: `Bearer ${seatToken}`');
    expect(connection).toContain('export class MultiplayerConnection');
    expect(connection).toContain('getEvents(this.options.gameId, this.snapshot.sequence');
    expect(connection).toContain('event.sequence === this.snapshot.sequence + 1');
    expect(types).toContain('export interface GameSnapshot');
    expect(types).toContain('export interface PlayerSession');
  });
});

