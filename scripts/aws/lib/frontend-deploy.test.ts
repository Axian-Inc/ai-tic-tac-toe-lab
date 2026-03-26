import { describe, expect, it, vi } from "vitest";

import {
  createFrontendBuildEnvironment,
  resolveFrontendMultiplayerApiBaseUrl,
} from "./frontend-deploy.js";
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

describe("resolveFrontendMultiplayerApiBaseUrl", () => {
  it("prefers the explicit config value when present", () => {
    expect(
      resolveFrontendMultiplayerApiBaseUrl({
        ...config,
        s3MultiplayerApiBaseUrl: "https://api.example.com",
      }),
    ).toBe("https://api.example.com");
  });

  it("resolves the backend base URL from the configured stack when needed", () => {
    const resolver = vi.fn(() => "https://resolved.example.com");

    expect(resolveFrontendMultiplayerApiBaseUrl(config, resolver)).toBe(
      "https://resolved.example.com",
    );
    expect(resolver).toHaveBeenCalledWith(
      "ttt-ms-aj-phase3-multiplayer-service",
      "us-west-2",
      "BackendBaseUrl",
    );
  });
});

describe("createFrontendBuildEnvironment", () => {
  it("injects VITE_MULTIPLAYER_API_BASE_URL when provided", () => {
    expect(
      createFrontendBuildEnvironment(
        { PATH: "/usr/bin" },
        "https://api.example.com",
      ),
    ).toEqual({
      PATH: "/usr/bin",
      VITE_MULTIPLAYER_API_BASE_URL: "https://api.example.com",
    });
  });

  it("preserves the base environment unchanged when no API base URL is set", () => {
    expect(createFrontendBuildEnvironment({ PATH: "/usr/bin" }, "")).toEqual({
      PATH: "/usr/bin",
    });
  });
});
