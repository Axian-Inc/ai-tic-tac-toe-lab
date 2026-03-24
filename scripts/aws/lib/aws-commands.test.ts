import { describe, expect, it } from "vitest";

import { buildCloudFormationDeployArgs, buildS3SyncArgs } from "./aws-commands.js";

describe("buildCloudFormationDeployArgs", () => {
  it("builds deploy arguments with capabilities and parameters", () => {
    expect(
      buildCloudFormationDeployArgs({
        region: "us-west-2",
        stackName: "ttt-ms-aj-phase2-multiplayer-service",
        templatePath: "infra/multiplayer-service-foundation.yaml",
        capabilities: ["CAPABILITY_NAMED_IAM"],
        parameterOverrides: ["ProjectTag=ttt-ms-aj-phase2", "ServicePort=3001"],
      }),
    ).toEqual([
      "cloudformation",
      "deploy",
      "--region",
      "us-west-2",
      "--stack-name",
      "ttt-ms-aj-phase2-multiplayer-service",
      "--template-file",
      "infra/multiplayer-service-foundation.yaml",
      "--capabilities",
      "CAPABILITY_NAMED_IAM",
      "--parameter-overrides",
      "ProjectTag=ttt-ms-aj-phase2",
      "ServicePort=3001",
      "--no-fail-on-empty-changeset",
    ]);
  });
});

describe("buildS3SyncArgs", () => {
  it("builds sync arguments with delete semantics", () => {
    expect(buildS3SyncArgs("/repo/dist", "ttt-ms-aj-tic-tac-toe-site", "us-west-2")).toEqual([
      "s3",
      "sync",
      "/repo/dist",
      "s3://ttt-ms-aj-tic-tac-toe-site",
      "--region",
      "us-west-2",
      "--delete",
    ]);
  });
});
