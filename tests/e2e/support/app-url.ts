import type { Page } from "@playwright/test";
import { getUiAutomationRuntimeConfig } from "../../playwright/runtime";

const FRONTEND_PORT = 4173;
const REMOTE_CDP_NAVIGATION_TIMEOUT_MS = 5000;
let resolvedRemoteAppOrigin: string | null = null;

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildCandidateOrigins(): string[] {
  const configuredBaseUrl = process.env.UI_AUTOMATION_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return [configuredBaseUrl.replace(/\/+$/, "")];
  }

  const configuredRemoteHost = process.env.UI_AUTOMATION_REMOTE_BROWSER_HOST?.trim();
  const candidates = [
    configuredRemoteHost ? `http://${configuredRemoteHost}:${FRONTEND_PORT}` : null,
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
  ].filter((value): value is string => value !== null);

  return Array.from(new Set(candidates));
}

function buildAbsoluteUrl(origin: string, path: string): string {
  return `${origin}${normalizePath(path)}`;
}

export async function gotoAppPath(page: Page, path: string): Promise<void> {
  const runtime = getUiAutomationRuntimeConfig(process.argv);

  if (runtime.browserTarget !== "RemoteCDP") {
    await page.goto(path);
    return;
  }

  const candidateOrigins = [
    resolvedRemoteAppOrigin,
    ...buildCandidateOrigins(),
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

  let lastError: unknown = null;
  for (const origin of candidateOrigins) {
    try {
      await page.goto(buildAbsoluteUrl(origin, path), {
        timeout: REMOTE_CDP_NAVIGATION_TIMEOUT_MS,
        waitUntil: "load",
      });
      resolvedRemoteAppOrigin = origin;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to reach the app in RemoteCDP mode for path ${path}.`);
}
