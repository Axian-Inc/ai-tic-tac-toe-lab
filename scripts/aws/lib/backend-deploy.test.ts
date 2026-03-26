import { describe, expect, it, vi } from "vitest";

import {
  buildBackendDeployContext,
  createBackendPackageManifest,
  createSsmCommandParameters,
  getReleaseId,
  getSsmCommandInvocationDetails,
  getSsmCommandFailureDetails,
  waitForSsmCommand,
} from "./backend-deploy.js";
import * as aws from "./aws.js";
import * as command from "./command.js";
import type { DevConfig } from "./config.js";

const config: DevConfig = {
  projectTag: "ttt-ms-aj-phase3",
  awsRegion: "us-west-2",
  s3WebsiteStackName: "ttt-ms-aj-phase3-s3-website",
  s3WebsiteBucketName: "ttt-ms-aj-phase3-tic-tac-toe-site",
  s3BuildDir: "dist",
  s3MultiplayerStackName: "ttt-ms-aj-phase3-multiplayer-service",
  s3MultiplayerApiBaseUrl: "",
  multiplayerStackName: "ttt-ms-aj-phase3-multiplayer-service",
  multiplayerInstanceType: "t3.micro",
  multiplayerServicePort: "3001",
  multiplayerHealthPath: "/health",
  multiplayerReadinessPath: "/ready",
};

describe("getReleaseId", () => {
  it("formats UTC timestamps as YYYYMMDDHHMMSS", () => {
    expect(getReleaseId(new Date("2026-03-23T20:39:45.123Z"))).toBe("20260323203945");
  });
});

describe("createSsmCommandParameters", () => {
  it("builds the backend deploy payload with expected commands", () => {
    const parameters = createSsmCommandParameters(
      "s3://bucket/releases/123.zip",
      "us-west-2",
      "20260323203945",
      "3001",
    );

    expect(parameters.commands).toContain(
      "aws s3 cp 's3://bucket/releases/123.zip' \"${ARCHIVE_PATH}\" --region 'us-west-2'",
    );
    expect(parameters.commands).toContain(
      "echo '[deploy] Downloading release bundle from S3...'",
    );
    expect(parameters.commands).toContain(
      "echo '[deploy] Installing production dependencies...'",
    );
    expect(parameters.commands).toContain('mkdir -p "${APP_ROOT}/releases"');
    expect(
      parameters.commands.some((commandLine) =>
        commandLine.includes("cat > /etc/systemd/system/ttt-multiplayer.service <<'EOF'"),
      ),
    ).toBe(true);
    expect(
      parameters.commands.some((commandLine) =>
        commandLine.includes("ExecStart=/usr/bin/env npm start"),
      ),
    ).toBe(true);
    expect(parameters.commands).toContain(
      "\"${NPM_BIN}\" install --omit=dev --no-audit --no-fund",
    );
    expect(parameters.commands.at(-2)).toBe("echo '[deploy] Verifying health endpoint...'");
    expect(parameters.commands.at(-1)).toBe(
      "for attempt in $(seq 1 15); do if curl --fail --silent 'http://127.0.0.1:3001/health' >/dev/null; then echo '[deploy] Backend release 20260323203945 is healthy.'; break; fi; if [[ \"$attempt\" -eq 15 ]]; then echo 'Backend health check did not succeed before timeout.' >&2; exit 1; fi; sleep 2; done",
    );
  });
});

describe("createBackendPackageManifest", () => {
  it("creates a backend-only package manifest from the repo manifest", () => {
    expect(
      createBackendPackageManifest({
        name: "ai-tic-tac-toe-lab",
        version: "0.1.0",
        type: "module",
        scripts: {
          start: "node dist-server/server/index.js",
          build: "vite build",
        },
        dependencies: {
          express: "^5.2.1",
          react: "^18.3.1",
        },
      }),
    ).toEqual({
      name: "ai-tic-tac-toe-lab-backend",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        start: "node dist-server/server/index.js",
      },
      dependencies: {
        express: "^5.2.1",
      },
    });
  });
});

describe("buildBackendDeployContext", () => {
  it("resolves stack outputs into a deploy context", () => {
    const resolveStackOutputSpy = vi
      .spyOn(aws, "resolveStackOutput")
      .mockImplementation(
        (_stackName: string, _region: string, outputKey: string) => {
        switch (outputKey) {
          case "DeploymentBucketName":
            return "bucket-name";
          case "BackendInstanceId":
            return "i-1234567890";
          case "BackendBaseUrl":
            return "http://example.com";
          default:
            throw new Error(`unexpected output key ${outputKey}`);
        }
      });

    const context = buildBackendDeployContext(config, "20260323203945");

    expect(context).toMatchObject({
      stackName: "ttt-ms-aj-phase3-multiplayer-service",
      region: "us-west-2",
      releaseId: "20260323203945",
      deploymentBucket: "bucket-name",
      instanceId: "i-1234567890",
      backendBaseUrl: "http://example.com",
      bundleKey: "releases/20260323203945.zip",
    });

    expect(resolveStackOutputSpy).toHaveBeenCalledTimes(3);
    resolveStackOutputSpy.mockRestore();
  });
});

describe("getSsmCommandInvocationDetails", () => {
  it("collects status, stdout, and stderr from the command invocation", () => {
    const captureCommandSpy = vi
      .spyOn(command, "captureCommand")
      .mockImplementation((_commandName: string, args: string[]) => {
        const query = args[args.indexOf("--query") + 1];

        switch (query) {
          case "Status":
            return "InProgress";
          case "StandardOutputContent":
            return "stdout details";
          case "StandardErrorContent":
            return "stderr details";
          default:
            throw new Error(`unexpected query ${query}`);
        }
      });

    expect(
      getSsmCommandInvocationDetails("cmd-123", "i-123", "us-west-2"),
    ).toEqual({
      status: "InProgress",
      standardOutput: "stdout details",
      standardError: "stderr details",
    });

    expect(captureCommandSpy).toHaveBeenCalledTimes(3);
    captureCommandSpy.mockRestore();
  });
});

describe("getSsmCommandFailureDetails", () => {
  it("collects status, stdout, and stderr from the failed command", () => {
    const captureCommandSpy = vi
      .spyOn(command, "captureCommand")
      .mockImplementation((_commandName: string, args: string[]) => {
        const query = args[args.indexOf("--query") + 1];

        switch (query) {
          case "Status":
            return "Failed";
          case "StandardOutputContent":
            return "stdout details";
          case "StandardErrorContent":
            return "stderr details";
          default:
            throw new Error(`unexpected query ${query}`);
        }
      });

    expect(
      getSsmCommandFailureDetails("cmd-123", "i-123", "us-west-2"),
    ).toEqual({
      status: "Failed",
      standardOutput: "stdout details",
      standardError: "stderr details",
    });

    expect(captureCommandSpy).toHaveBeenCalledTimes(3);
    captureCommandSpy.mockRestore();
  });
});

describe("waitForSsmCommand", () => {
  it("streams incremental output until the command succeeds", () => {
    let invocationCount = 0;
    const captureCommandSpy = vi
      .spyOn(command, "captureCommand")
      .mockImplementation((_commandName: string, args: string[]) => {
        invocationCount += 1;
        const cycle = invocationCount <= 3 ? 1 : 2;
        const query = args[args.indexOf("--query") + 1];

        if (cycle === 1) {
          switch (query) {
            case "Status":
              return "InProgress";
            case "StandardOutputContent":
              return "[deploy] Starting\n";
            case "StandardErrorContent":
              return "None";
            default:
              throw new Error(`unexpected query ${query}`);
          }
        }

        switch (query) {
          case "Status":
            return "Success";
          case "StandardOutputContent":
            return "[deploy] Starting\n[deploy] Done\n";
          case "StandardErrorContent":
            return "None";
          default:
            throw new Error(`unexpected query ${query}`);
        }
      });

    const stdoutWriteSpy = vi
      .spyOn(process.stdout, "write")
      .mockReturnValue(true);
    const stderrWriteSpy = vi
      .spyOn(process.stderr, "write")
      .mockReturnValue(true);
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    expect(waitForSsmCommand("cmd-123", "i-123", "us-west-2", 0)).toEqual({
      status: "Success",
      standardOutput: "[deploy] Starting\n[deploy] Done\n",
      standardError: "None",
    });

    expect(captureCommandSpy).toHaveBeenCalledTimes(6);
    expect(stdoutWriteSpy).toHaveBeenNthCalledWith(1, "[deploy] Starting\n");
    expect(stdoutWriteSpy).toHaveBeenNthCalledWith(2, "[deploy] Done\n");
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, "SSM command status: InProgress");
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, "SSM command status: Success");

    captureCommandSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
    stderrWriteSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
