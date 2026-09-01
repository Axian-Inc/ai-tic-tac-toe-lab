import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

export interface PlayerBrowser {
  context: BrowserContext;
  page: Page;
}

export interface MultiplayerWireAdapter {
  create(commandId: string): Promise<{ gameId: string; sequence: number; seatToken: string }>;
  snapshot(gameId: string): Promise<{ sequence: number; status: string; moves: unknown[] }>;
}

export interface MultiplayerEnvironment {
  apiBaseUrl: string;
  webSocketUrl: string;
}

/**
 * Reads the same public Vite seams as the application. Phase 2 browser tests
 * must point at an authoritative API and WebSocket endpoint; silently falling
 * back to the Phase 1-only UI would produce false-positive acceptance runs.
 */
export function multiplayerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): MultiplayerEnvironment {
  const apiBaseUrl = environment.VITE_API_BASE_URL;
  const webSocketUrl = environment.VITE_WS_URL;
  if (!apiBaseUrl || !webSocketUrl) {
    throw new Error('Phase 2 E2E requires VITE_API_BASE_URL and VITE_WS_URL.');
  }

  const api = new URL(apiBaseUrl);
  const socket = new URL(webSocketUrl);
  if (!['http:', 'https:'].includes(api.protocol)) {
    throw new Error('VITE_API_BASE_URL must use http or https.');
  }
  if (!['ws:', 'wss:'].includes(socket.protocol)) {
    throw new Error('VITE_WS_URL must use ws or wss.');
  }

  return { apiBaseUrl: apiBaseUrl.replace(/\/$/, ''), webSocketUrl };
}

export async function isolatedPlayer(browser: Browser): Promise<PlayerBrowser> {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

export function httpMultiplayerAdapter(
  request: APIRequestContext,
  apiBaseUrl: string,
): MultiplayerWireAdapter {
  return {
    async create(commandId) {
      const response = await request.post(`${apiBaseUrl}/api/v1/games`, { data: { commandId } });
      expect(response.status()).toBe(201);
      const body = (await response.json()) as {
        game: { id: string; sequence: number };
        seatToken: string;
      };
      return { gameId: body.game.id, sequence: body.game.sequence, seatToken: body.seatToken };
    },
    async snapshot(gameId) {
      const response = await request.get(`${apiBaseUrl}/api/v1/games/${gameId}`);
      expect(response.status()).toBe(200);
      return response.json() as Promise<{ sequence: number; status: string; moves: unknown[] }>;
    },
  };
}

export async function expectAuthoritativeSequence(page: Page, sequence: number): Promise<void> {
  await expect(page.getByTestId('multiplayer-sequence').locator('strong')).toHaveText(String(sequence));
}
