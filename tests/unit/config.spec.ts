import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { loadDevConfig, parseFlatYaml, resolveRepoRoot } from "../../scripts/aws/lib/config.js";

test.describe("parseFlatYaml", () => {
  test("parses flat key/value pairs and strips quotes", () => {
    const values = parseFlatYaml(`
# comment
project_tag: ttt-ms-aj-phase3
s3_multiplayer_api_base_url: ""
quoted_single: 'value'
quoted_double: "other"
`);

    expect(values).toEqual({
      project_tag: "ttt-ms-aj-phase3",
      s3_multiplayer_api_base_url: "",
      quoted_single: "value",
      quoted_double: "other",
    });
  });
});

test.describe("loadDevConfig", () => {
  test("loads the current flat dev config shape", () => {
    const config = loadDevConfig();

    expect(config.projectTag).toBe("ttt-ms-aj-phase3");
    expect(config.awsRegion).toBe("us-west-2");
    expect(config.s3WebsiteStackName).toBe("ttt-ms-aj-phase3-website");
    expect(config.multiplayerStackName).toBe("ttt-ms-aj-phase3-mp-service");
    expect(config.multiplayerServicePort).toBe("3001");
  });
});

test.describe("resolveRepoRoot", () => {
  test("finds the repo root when the working directory is dist-scripts", () => {
    const originalCwd = process.cwd();
    const distScriptsPath = path.join(originalCwd, "dist-scripts");
    const distScriptsAlreadyExists = existsSync(distScriptsPath);

    if (!distScriptsAlreadyExists) {
      mkdirSync(distScriptsPath, { recursive: true });
    }

    process.chdir(distScriptsPath);

    try {
      expect(resolveRepoRoot()).toBe(originalCwd);
    } finally {
      process.chdir(originalCwd);

      if (!distScriptsAlreadyExists) {
        rmSync(distScriptsPath, { recursive: true, force: true });
      }
    }
  });
});
