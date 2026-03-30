import { mock } from "node:test";

import { expect, test } from "@playwright/test";

import type { DevConfig } from "../../scripts/aws/lib/config.js";
import {
  resolveBackendBaseUrl,
  resolveDeployedUrls,
  resolveWebsiteUrl,
} from "../../scripts/aws/lib/stack-urls.js";

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

test.afterEach(() => {
  mock.restoreAll();
});

test.describe("resolveWebsiteUrl", () => {
  test("resolves the website URL from the configured website stack", () => {
    const resolver = mock.fn(() => "http://frontend.example.com");

    expect(resolveWebsiteUrl(config, resolver)).toBe("http://frontend.example.com");
    expect(resolver.mock.calls).toHaveLength(1);
    expect(resolver.mock.calls[0]?.arguments).toEqual([
      "ttt-ms-aj-phase3-website",
      "us-west-2",
      "WebsiteURL",
    ]);
  });
});

test.describe("resolveBackendBaseUrl", () => {
  test("prefers the explicit backend base URL when configured", () => {
    const resolver = mock.fn();

    expect(
      resolveBackendBaseUrl(
        { ...config, s3MultiplayerApiBaseUrl: "https://api.example.com" },
        resolver
      )
    ).toBe("https://api.example.com");
    expect(resolver.mock.calls).toHaveLength(0);
  });

  test("resolves the backend base URL from the multiplayer stack output by default", () => {
    const resolver = mock.fn(() => "https://backend.example.com");

    expect(resolveBackendBaseUrl(config, resolver)).toBe(
      "https://backend.example.com"
    );
    expect(resolver.mock.calls).toHaveLength(1);
    expect(resolver.mock.calls[0]?.arguments).toEqual([
      "ttt-ms-aj-phase3-mp-service",
      "us-west-2",
      "BackendBaseUrl",
    ]);
  });
});

test.describe("resolveDeployedUrls", () => {
  test("returns both deployed URLs", () => {
    const resolver = mock.fn(
      (stackName: string, _region: string, outputKey: string) => {
        if (outputKey === "WebsiteURL") {
          return `http://${stackName}.example.com`;
        }

        return `https://${stackName}.example.com`;
      }
    );

    expect(resolveDeployedUrls(config, resolver)).toEqual({
      websiteUrl: "http://ttt-ms-aj-phase3-website.example.com",
      backendBaseUrl: "https://ttt-ms-aj-phase3-mp-service.example.com",
    });
  });
});
