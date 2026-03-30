import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { resolveStackOutput } from "./aws.js";
import { requireCommand, runCommand, captureCommand } from "./command.js";
import { ensureFileExists } from "./fs.js";
import { ensureProjectTaggedName } from "./guards.js";
import type { DevConfig } from "./config.js";
import { repoRoot } from "./config.js";

export interface BackendDeployContext {
  stackName: string;
  region: string;
  servicePort: string;
  releaseId: string;
  deploymentBucket: string;
  instanceId: string;
  backendBaseUrl: string;
  bundleKey: string;
  bundleUri: string;
}

export interface SsmCommandParameters {
  commands: string[];
}

export interface SsmCommandFailureDetails {
  status: string;
  standardOutput: string;
  standardError: string;
}

interface PackageManifest {
  name?: string;
  private?: boolean;
  version?: string;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
}

interface SsmCommandOutputCursor {
  standardOutput: string;
  standardError: string;
}

export function getReleaseId(now = new Date()): string {
  const iso = now.toISOString().replace(/[-:TZ.]/gu, "");
  return iso.slice(0, 14);
}

export function buildBackendDeployContext(
  config: DevConfig,
  releaseId = process.env.RELEASE_ID ?? getReleaseId(),
  resolver: typeof resolveStackOutput = resolveStackOutput,
): BackendDeployContext {
  const stackName = config.multiplayerStackName;
  const region = config.awsRegion;

  ensureProjectTaggedName(stackName, "stack name", config.projectTag);

  return {
    stackName,
    region,
    servicePort: config.multiplayerServicePort,
    releaseId,
    deploymentBucket: resolver(stackName, region, "DeploymentBucketName"),
    instanceId: resolver(stackName, region, "BackendInstanceId"),
    backendBaseUrl: resolver(stackName, region, "BackendBaseUrl"),
    bundleKey: `releases/${releaseId}.zip`,
    bundleUri: "",
  };
}

export function createSsmCommandParameters(
  bundleUri: string,
  region: string,
  releaseId: string,
  servicePort: string,
): SsmCommandParameters {
  return {
    commands: [
      "set -euo pipefail",
      "APP_ROOT=/opt/ttt-multiplayer",
      `RELEASE_DIR=/opt/ttt-multiplayer/releases/${releaseId}`,
      `ARCHIVE_PATH=/tmp/${releaseId}.zip`,
      `echo '[deploy] Starting backend release ${releaseId}'`,
      "echo '[deploy] Resolving npm binary...'",
      "NPM_BIN=$(command -v npm || true)",
      'if [[ -z "${NPM_BIN}" && -x /usr/bin/npm ]]; then NPM_BIN=/usr/bin/npm; fi',
      "echo '[deploy] Installing npm when missing...'",
      'if [[ -z "${NPM_BIN}" ]]; then dnf install -y nodejs npm; NPM_BIN=$(command -v npm || true); fi',
      'if [[ -z "${NPM_BIN}" ]]; then echo \'npm is required on the backend instance but was not found.\' >&2; exit 1; fi',
      "echo '[deploy] Preparing release directories...'",
      'mkdir -p "${APP_ROOT}/releases"',
      "echo '[deploy] Writing backend environment file...'",
      `cat > /etc/ttt-multiplayer.env <<'EOF'
HOST=0.0.0.0
PORT=${servicePort}
EOF`,
      "echo '[deploy] Writing systemd unit...'",
      `cat > /etc/systemd/system/ttt-multiplayer.service <<'EOF'
[Unit]
Description=Tic Tac Toe multiplayer backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/ttt-multiplayer/current
EnvironmentFile=-/etc/ttt-multiplayer.env
ExecStart=/usr/bin/env npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF`,
      "echo '[deploy] Resetting release directory...'",
      'rm -rf "${RELEASE_DIR}"',
      'mkdir -p "${RELEASE_DIR}"',
      "echo '[deploy] Downloading release bundle from S3...'",
      `aws s3 cp '${bundleUri}' "\${ARCHIVE_PATH}" --region '${region}'`,
      "echo '[deploy] Unpacking release bundle...'",
      'unzip -oq "${ARCHIVE_PATH}" -d "${RELEASE_DIR}"',
      'cd "${RELEASE_DIR}"',
      "echo '[deploy] Installing production dependencies...'",
      '"${NPM_BIN}" install --omit=dev --no-audit --no-fund',
      "echo '[deploy] Promoting release to current...'",
      'ln -sfn "${RELEASE_DIR}" "${APP_ROOT}/current"',
      'rm -f "${ARCHIVE_PATH}"',
      "echo '[deploy] Reloading systemd and restarting service...'",
      "systemctl daemon-reload",
      "systemctl enable ttt-multiplayer.service",
      "systemctl restart ttt-multiplayer.service",
      "echo '[deploy] Verifying health endpoint...'",
      `for attempt in $(seq 1 15); do if curl --fail --silent 'http://127.0.0.1:${servicePort}/health' >/dev/null; then echo '[deploy] Backend release ${releaseId} is healthy.'; break; fi; if [[ "$attempt" -eq 15 ]]; then echo 'Backend health check did not succeed before timeout.' >&2; exit 1; fi; sleep 2; done`,
    ],
  };
}

export function getSsmCommandInvocationDetails(
  commandId: string,
  instanceId: string,
  region: string,
  capture: typeof captureCommand = captureCommand,
): SsmCommandFailureDetails {
  const status = capture("aws", [
    "ssm",
    "get-command-invocation",
    "--region",
    region,
    "--command-id",
    commandId,
    "--instance-id",
    instanceId,
    "--query",
    "Status",
    "--output",
    "text",
  ]);

  const standardOutput = capture("aws", [
    "ssm",
    "get-command-invocation",
    "--region",
    region,
    "--command-id",
    commandId,
    "--instance-id",
    instanceId,
    "--query",
    "StandardOutputContent",
    "--output",
    "text",
  ]);

  const standardError = capture("aws", [
    "ssm",
    "get-command-invocation",
    "--region",
    region,
    "--command-id",
    commandId,
    "--instance-id",
    instanceId,
    "--query",
    "StandardErrorContent",
    "--output",
    "text",
  ]);

  return {
    status,
    standardOutput,
    standardError,
  };
}

export function getSsmCommandFailureDetails(
  commandId: string,
  instanceId: string,
  region: string,
  capture: typeof captureCommand = captureCommand,
): SsmCommandFailureDetails {
  return getSsmCommandInvocationDetails(commandId, instanceId, region, capture);
}

export function createBackendPackageManifest(
  rootManifest: PackageManifest,
): PackageManifest {
  const startScript = rootManifest.scripts?.start;
  const expressVersion = rootManifest.dependencies?.express;

  if (!startScript) {
    throw new Error("package.json must define a start script for backend deploys");
  }

  if (!expressVersion) {
    throw new Error(
      "package.json must declare express in dependencies for backend deploys",
    );
  }

  return {
    name: rootManifest.name ? `${rootManifest.name}-backend` : "ttt-multiplayer-backend",
    private: true,
    version: rootManifest.version ?? "0.1.0",
    type: rootManifest.type ?? "module",
    scripts: {
      start: startScript,
    },
    dependencies: {
      express: expressVersion,
    },
  };
}

function sleep(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function writeNewOutput(
  stream: NodeJS.WriteStream,
  content: string,
  previousContent: string,
): string {
  if (content.length === 0 || content === "None") {
    return previousContent;
  }

  if (content.startsWith(previousContent)) {
    const nextChunk = content.slice(previousContent.length);
    if (nextChunk.length > 0) {
      stream.write(nextChunk);
    }

    return content;
  }

  stream.write(content);
  if (!content.endsWith("\n")) {
    stream.write("\n");
  }

  return content;
}

function isTerminalCommandStatus(status: string): boolean {
  return !["Pending", "InProgress", "Delayed"].includes(status);
}

export function waitForSsmCommand(
  commandId: string,
  instanceId: string,
  region: string,
  pollIntervalMs = 2000,
  capture: typeof captureCommand = captureCommand,
): SsmCommandFailureDetails {
  let lastStatus = "";
  const outputCursor: SsmCommandOutputCursor = {
    standardOutput: "",
    standardError: "",
  };

  while (true) {
    const details = getSsmCommandInvocationDetails(commandId, instanceId, region, capture);

    if (details.status !== lastStatus) {
      console.log(`SSM command status: ${details.status}`);
      lastStatus = details.status;
    }

    outputCursor.standardOutput = writeNewOutput(
      process.stdout,
      details.standardOutput,
      outputCursor.standardOutput,
    );
    outputCursor.standardError = writeNewOutput(
      process.stderr,
      details.standardError,
      outputCursor.standardError,
    );

    if (isTerminalCommandStatus(details.status)) {
      return details;
    }

    sleep(pollIntervalMs);
  }
}

export function printCommandFailure(
  commandId: string,
  instanceId: string,
  region: string,
): never {
  const { status, standardOutput, standardError } = getSsmCommandFailureDetails(
    commandId,
    instanceId,
    region,
  );

  process.stderr.write(
    `Error: backend deployment command finished with status '${status}'.\n`,
  );

  if (standardOutput.length > 0 && standardOutput !== "None") {
    process.stderr.write(`${standardOutput}\n`);
  }

  if (standardError.length > 0 && standardError !== "None") {
    process.stderr.write(`${standardError}\n`);
  }

  throw new Error("backend deployment failed");
}

export function deployBackend(config: DevConfig): void {
  requireCommand("aws", "AWS CLI is required but not installed.");
  requireCommand("npm", "npm is required but not installed.");
  requireCommand("zip", "zip is required but not installed.");
  ensureFileExists(path.join(repoRoot, "package.json"));

  console.log("Building backend bundle with 'npm run server:build'...");
  runCommand("npm", ["run", "server:build"], { cwd: repoRoot });

  const context = buildBackendDeployContext(config);
  context.bundleUri = `s3://${context.deploymentBucket}/${context.bundleKey}`;

  const tempRoot = mkdtempSync(path.join(os.tmpdir(), `${context.stackName}-`));
  const stagingDir = path.join(tempRoot, "staging");
  const archivePath = path.join(tempRoot, `${context.releaseId}.zip`);
  const ssmParametersPath = path.join(tempRoot, "ssm-parameters.json");
  const rootManifest = JSON.parse(
    captureCommand("cat", [path.join(repoRoot, "package.json")]),
  ) as PackageManifest;
  const backendManifest = createBackendPackageManifest(rootManifest);

  try {
    mkdirSync(stagingDir, { recursive: true });
    cpSync(path.join(repoRoot, "dist-server"), path.join(stagingDir, "dist-server"), {
      recursive: true,
    });
    writeFileSync(
      path.join(stagingDir, "package.json"),
      JSON.stringify(backendManifest, null, 2),
    );

    runCommand("zip", ["-rq", archivePath, "."], { cwd: stagingDir });

    console.log(
      `Uploading backend release '${context.releaseId}' to ${context.bundleUri}...`,
    );
    runCommand("aws", ["s3", "cp", archivePath, context.bundleUri, "--region", context.region]);

    const ssmParameters = createSsmCommandParameters(
      context.bundleUri,
      context.region,
      context.releaseId,
      context.servicePort,
    );
    writeFileSync(ssmParametersPath, JSON.stringify(ssmParameters, null, 2));

    console.log(
      `Deploying backend release '${context.releaseId}' to instance '${context.instanceId}'...`,
    );

    const commandId = captureCommand("aws", [
      "ssm",
      "send-command",
      "--region",
      context.region,
      "--instance-ids",
      context.instanceId,
      "--document-name",
      "AWS-RunShellScript",
      "--comment",
      `Deploy Tic-Tac-Toe multiplayer backend ${context.releaseId}`,
      "--parameters",
      `file://${ssmParametersPath}`,
      "--query",
      "Command.CommandId",
      "--output",
      "text",
    ]);

    console.log(`SSM command id: ${commandId}`);
    const { status: commandStatus } = waitForSsmCommand(
      commandId,
      context.instanceId,
      context.region,
    );

    if (commandStatus !== "Success") {
      printCommandFailure(commandId, context.instanceId, context.region);
    }

    console.log("Backend deployment complete.");
    console.log(`Backend base URL: ${context.backendBaseUrl}`);
    console.log(`Health check: ${context.backendBaseUrl}/health`);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
