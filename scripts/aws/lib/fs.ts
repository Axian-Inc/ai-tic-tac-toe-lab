import { existsSync } from "node:fs";

export function ensureFileExists(filePath: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`file not found at ${filePath}`);
  }
}

export function ensureDirectoryExists(directoryPath: string): void {
  if (!existsSync(directoryPath)) {
    throw new Error(`build output directory '${directoryPath}' was not created.`);
  }
}
