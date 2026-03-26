import { requireCommand } from "./lib/command.js";
import { loadDevConfig } from "./lib/config.js";
import { resolveDeployedUrls } from "./lib/stack-urls.js";

function main(): void {
  requireCommand("aws", "AWS CLI is required but not installed.");

  const config = loadDevConfig();
  const urls = resolveDeployedUrls(config);

  console.log(`Website URL: ${urls.websiteUrl}`);
  console.log(`Backend base URL: ${urls.backendBaseUrl}`);
}

main();
