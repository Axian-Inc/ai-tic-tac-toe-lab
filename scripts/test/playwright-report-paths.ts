import path from "node:path";

export const PLAYWRIGHT_REPORT_DIRECTORY = path.resolve(
  process.cwd(),
  "test-results/playwright"
);

export const DEFAULT_JUNIT_PATH = path.join(
  PLAYWRIGHT_REPORT_DIRECTORY,
  "junit.xml"
);

export const DEFAULT_HTML_REPORT_PATH = path.join(
  PLAYWRIGHT_REPORT_DIRECTORY,
  "report.html"
);
