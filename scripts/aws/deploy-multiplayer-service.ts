import { loadDevConfig } from "./lib/config.js";
import { deployBackend } from "./lib/backend-deploy.js";

deployBackend(loadDevConfig());
