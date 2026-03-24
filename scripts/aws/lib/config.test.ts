import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadDevConfig, parseFlatYaml, resolveRepoRoot } from "./config.js";

describe("parseFlatYaml", () => {
  it("parses flat key/value pairs and strips quotes", () => {
    const values = parseFlatYaml(`
# comment
project_tag: ttt-ms-aj-phase2
s3_multiplayer_api_base_url: ""
quoted_single: 'value'
quoted_double: "other"
`);

    expect(values).toEqual({
      project_tag: "ttt-ms-aj-phase2",
      s3_multiplayer_api_base_url: "",
      quoted_single: "value",
      quoted_double: "other",
    });
  });
});

describe("loadDevConfig", () => {
  it("loads the current flat dev config shape", () => {
    const config = loadDevConfig();

    expect(config.projectTag).toBe("ttt-ms-aj-phase2");
    expect(config.awsRegion).toBe("us-west-2");
    expect(config.s3WebsiteStackName).toBe("ttt-ms-aj-phase2-website");
    expect(config.multiplayerStackName).toBe("ttt-ms-aj-phase2-mp-service");
    expect(config.multiplayerServicePort).toBe("3001");
  });
});

describe("resolveRepoRoot", () => {
  it("finds the repo root when the working directory is dist-scripts", () => {
    const originalCwd = process.cwd();
    process.chdir(path.join(originalCwd, "dist-scripts"));

    try {
      expect(resolveRepoRoot()).toBe(originalCwd);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
