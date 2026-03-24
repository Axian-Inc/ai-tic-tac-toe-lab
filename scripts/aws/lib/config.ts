import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface DevConfig {
  projectTag: string;
  awsRegion: string;
  s3WebsiteStackName: string;
  s3WebsiteBucketName: string;
  s3BuildDir: string;
  s3MultiplayerStackName: string;
  s3MultiplayerApiBaseUrl: string;
  multiplayerStackName: string;
  multiplayerInstanceType: string;
  multiplayerServicePort: string;
  multiplayerHealthPath: string;
  multiplayerReadinessPath: string;
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function isRepoRoot(candidatePath: string): boolean {
  return (
    existsSync(path.join(candidatePath, "package.json")) &&
    existsSync(path.join(candidatePath, "infra/dev.yaml"))
  );
}

function findRepoRoot(startPath: string): string | null {
  let currentPath = path.resolve(startPath);

  while (true) {
    if (isRepoRoot(currentPath)) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return null;
    }

    currentPath = parentPath;
  }
}

export function resolveRepoRoot(): string {
  const candidates = [process.cwd(), currentDir];

  for (const candidate of candidates) {
    const repoRoot = findRepoRoot(candidate);
    if (repoRoot) {
      return repoRoot;
    }
  }

  throw new Error(
    `Unable to resolve repository root from '${process.cwd()}' or '${currentDir}'.`,
  );
}

export const repoRoot = resolveRepoRoot();
export const devConfigPath = path.join(repoRoot, "infra/dev.yaml");

function trimQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseFlatYaml(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = trimQuotes(line.slice(separatorIndex + 1).trim());
    result[key] = value;
  }

  return result;
}

function requireValue(
  values: Record<string, string>,
  key: string,
  sourcePath: string,
): string {
  const value = values[key];
  if (!value) {
    throw new Error(
      `required config '${key}' is missing from ${sourcePath}.`,
    );
  }

  return value;
}

function optionalValue(values: Record<string, string>, key: string): string {
  return values[key] ?? "";
}

export function loadDevConfig(configPath = devConfigPath): DevConfig {
  const raw = readFileSync(configPath, "utf8");
  const values = parseFlatYaml(raw);

  return {
    projectTag: requireValue(values, "project_tag", configPath),
    awsRegion: requireValue(values, "aws_region", configPath),
    s3WebsiteStackName: requireValue(values, "s3_website_stack_name", configPath),
    s3WebsiteBucketName: requireValue(values, "s3_website_bucket_name", configPath),
    s3BuildDir: requireValue(values, "s3_build_dir", configPath),
    s3MultiplayerStackName: optionalValue(values, "s3_multiplayer_stack_name"),
    s3MultiplayerApiBaseUrl: optionalValue(values, "s3_multiplayer_api_base_url"),
    multiplayerStackName: requireValue(values, "multiplayer_stack_name", configPath),
    multiplayerInstanceType: requireValue(
      values,
      "multiplayer_instance_type",
      configPath,
    ),
    multiplayerServicePort: requireValue(
      values,
      "multiplayer_service_port",
      configPath,
    ),
    multiplayerHealthPath: requireValue(
      values,
      "multiplayer_health_path",
      configPath,
    ),
    multiplayerReadinessPath: requireValue(
      values,
      "multiplayer_readiness_path",
      configPath,
    ),
  };
}
