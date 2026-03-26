import { describe, expect, it, vi } from "vitest";

import type { DevConfig } from "./config.js";
import {
  resolveBackendBaseUrl,
  resolveDeployedUrls,
  resolveWebsiteUrl,
} from "./stack-urls.js";

const config: DevConfig = {
  projectTag: "ttt-ms-aj-phase3",
  awsRegion: "us-west-2",
  s3WebsiteStackName: "ttt-ms-aj-phase3-website",
  s3WebsiteBucketName: "ttt-ms-aj-phase3-website-storage",
  s3BuildDir: "dist",
  s3MultiplayerStackName: "ttt-ms-aj-phase3-mp-service",
  s3MultiplayerApiBaseUrl: "",
  multiplayerStackName: "ttt-ms-aj-phase3-mp-service",
  multiplayerInstanceType: "t3.micro",
  multiplayerServicePort: "3001",
  multiplayerHealthPath: "/health",
  multiplayerReadinessPath: "/ready",
};

describe("resolveWebsiteUrl", () => {
  it("resolves the website URL from the configured website stack", () => {
    const resolver = vi.fn(() => "http://frontend.example.com");

    expect(resolveWebsiteUrl(config, resolver)).toBe("http://frontend.example.com");
    expect(resolver).toHaveBeenCalledWith(
      "ttt-ms-aj-phase3-website",
      "us-west-2",
      "WebsiteURL",
    );
  });
});

describe("resolveBackendBaseUrl", () => {
  it("prefers the explicit backend base URL when configured", () => {
    const resolver = vi.fn();

    expect(
      resolveBackendBaseUrl(
        { ...config, s3MultiplayerApiBaseUrl: "https://api.example.com" },
        resolver,
      ),
    ).toBe("https://api.example.com");
    expect(resolver).not.toHaveBeenCalled();
  });

  it("resolves the backend base URL from the multiplayer stack output by default", () => {
    const resolver = vi.fn(() => "https://backend.example.com");

    expect(resolveBackendBaseUrl(config, resolver)).toBe("https://backend.example.com");
    expect(resolver).toHaveBeenCalledWith(
      "ttt-ms-aj-phase3-mp-service",
      "us-west-2",
      "BackendBaseUrl",
    );
  });
});

describe("resolveDeployedUrls", () => {
  it("returns both deployed URLs", () => {
    const resolver = vi.fn((stackName: string, _region: string, outputKey: string) => {
      if (outputKey === "WebsiteURL") {
        return `http://${stackName}.example.com`;
      }

      return `https://${stackName}.example.com`;
    });

    expect(resolveDeployedUrls(config, resolver)).toEqual({
      websiteUrl: "http://ttt-ms-aj-phase3-website.example.com",
      backendBaseUrl: "https://ttt-ms-aj-phase3-mp-service.example.com",
    });
  });
});
