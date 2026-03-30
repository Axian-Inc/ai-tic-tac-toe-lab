import { expect, test } from "@playwright/test";

import {
  buildBackendDeployContext,
  createBackendPackageManifest,
  createSsmCommandParameters,
  getReleaseId,
  getSsmCommandFailureDetails,
  getSsmCommandInvocationDetails,
  waitForSsmCommand,
} from "../../scripts/aws/lib/backend-deploy.js";
import type { DevConfig } from "../../scripts/aws/lib/config.js";

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

test.describe("getReleaseId", () => {
  test("formats UTC timestamps as YYYYMMDDHHMMSS", () => {
    expect(getReleaseId(new Date("2026-03-23T20:39:45.123Z"))).toBe("20260323203945");
  });
});

test.describe("createSsmCommandParameters", () => {
  test("builds the backend deploy payload with expected commands", () => {
    const parameters = createSsmCommandParameters(
      "s3://bucket/releases/123.zip",
      "us-west-2",
      "20260323203945",
      "3001"
    );

    expect(parameters.commands).toContain(
      "aws s3 cp 's3://bucket/releases/123.zip' \"${ARCHIVE_PATH}\" --region 'us-west-2'"
    );
    expect(parameters.commands).toContain(
      "echo '[deploy] Downloading release bundle from S3...'"
    );
    expect(parameters.commands).toContain(
      "echo '[deploy] Installing production dependencies...'"
    );
    expect(parameters.commands).toContain('mkdir -p "${APP_ROOT}/releases"');
    expect(
      parameters.commands.some((commandLine) =>
        commandLine.includes("cat > /etc/systemd/system/ttt-multiplayer.service <<'EOF'")
      )
    ).toBe(true);
    expect(
      parameters.commands.some((commandLine) =>
        commandLine.includes("ExecStart=/usr/bin/env npm start")
      )
    ).toBe(true);
    expect(parameters.commands).toContain(
      "\"${NPM_BIN}\" install --omit=dev --no-audit --no-fund"
    );
    expect(parameters.commands.at(-2)).toBe("echo '[deploy] Verifying health endpoint...'");
    expect(parameters.commands.at(-1)).toBe(
      "for attempt in $(seq 1 15); do if curl --fail --silent 'http://127.0.0.1:3001/health' >/dev/null; then echo '[deploy] Backend release 20260323203945 is healthy.'; break; fi; if [[ \"$attempt\" -eq 15 ]]; then echo 'Backend health check did not succeed before timeout.' >&2; exit 1; fi; sleep 2; done"
    );
  });
});

test.describe("createBackendPackageManifest", () => {
  test("creates a backend-only package manifest from the repo manifest", () => {
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
      })
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

test.describe("buildBackendDeployContext", () => {
  test("resolves stack outputs into a deploy context", () => {
    const resolveStackOutput = (
      _stackName: string,
      _region: string,
      outputKey: string
    ) => {
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
      };

    const context = buildBackendDeployContext(
      config,
      "20260323203945",
      resolveStackOutput
    );

    expect(context).toMatchObject({
      stackName: "ttt-ms-aj-phase3-multiplayer-service",
      region: "us-west-2",
      releaseId: "20260323203945",
      deploymentBucket: "bucket-name",
      instanceId: "i-1234567890",
      backendBaseUrl: "http://example.com",
      bundleKey: "releases/20260323203945.zip",
    });
  });
});

test.describe("getSsmCommandInvocationDetails", () => {
  test("collects status, stdout, and stderr from the command invocation", () => {
    const calls: string[] = [];
    const captureCommand = (_commandName: string, args: string[]) => {
        const query = args[args.indexOf("--query") + 1];
        calls.push(String(query));

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
      };

    expect(
      getSsmCommandInvocationDetails(
        "cmd-123",
        "i-123",
        "us-west-2",
        captureCommand
      )
    ).toEqual({
      status: "InProgress",
      standardOutput: "stdout details",
      standardError: "stderr details",
    });

    expect(calls).toEqual([
      "Status",
      "StandardOutputContent",
      "StandardErrorContent",
    ]);
  });
});

test.describe("getSsmCommandFailureDetails", () => {
  test("collects status, stdout, and stderr from the failed command", () => {
    const calls: string[] = [];
    const captureCommand = (_commandName: string, args: string[]) => {
        const query = args[args.indexOf("--query") + 1];
        calls.push(String(query));

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
      };

    expect(
      getSsmCommandFailureDetails(
        "cmd-123",
        "i-123",
        "us-west-2",
        captureCommand
      )
    ).toEqual({
      status: "Failed",
      standardOutput: "stdout details",
      standardError: "stderr details",
    });

    expect(calls).toEqual([
      "Status",
      "StandardOutputContent",
      "StandardErrorContent",
    ]);
  });
});

test.describe("waitForSsmCommand", () => {
  test("streams incremental output until the command succeeds", () => {
    let invocationCount = 0;
    const captureCommand = (_commandName: string, args: string[]) => {
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
      };

    const stdoutWrites: string[] = [];
    const stderrWrites: string[] = [];
    const consoleLogs: string[] = [];
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    const originalConsoleLog = console.log;

    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdoutWrites.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderrWrites.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    console.log = (...args: unknown[]) => {
      consoleLogs.push(args.join(" "));
    };

    try {
      expect(
        waitForSsmCommand("cmd-123", "i-123", "us-west-2", 0, captureCommand)
      ).toEqual({
        status: "Success",
        standardOutput: "[deploy] Starting\n[deploy] Done\n",
        standardError: "None",
      });
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      console.log = originalConsoleLog;
    }

    expect(invocationCount).toBe(6);
    expect(stdoutWrites).toEqual(["[deploy] Starting\n", "[deploy] Done\n"]);
    expect(stderrWrites).toEqual([]);
    expect(consoleLogs).toEqual([
      "SSM command status: InProgress",
      "SSM command status: Success",
    ]);
  });
});
