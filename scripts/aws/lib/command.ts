import { spawnSync } from "node:child_process";

interface BaseCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface RunCommandOptions extends BaseCommandOptions {
  stdio?: "inherit" | "pipe";
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].join(" ");
}

export function requireCommand(commandName: string, installHint: string): void {
  const result = spawnSync(commandName, ["--version"], {
    stdio: "ignore",
    shell: false,
  });

  if (result.error && "code" in result.error && result.error.code === "ENOENT") {
    throw new Error(installHint);
  }
}

export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    stdio: options.stdio ?? "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `command failed (${result.status}): ${formatCommand(command, args)}`,
    );
  }

  return result.stdout ?? "";
}

export function captureCommand(
  command: string,
  args: string[],
  options: BaseCommandOptions = {},
): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    stdio: "pipe",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr ?? "").trim();
    if (stderr.length > 0) {
      process.stderr.write(`${stderr}\n`);
    }
    throw new Error(
      `command failed (${result.status}): ${formatCommand(command, args)}`,
    );
  }

  return (result.stdout ?? "").trim();
}
