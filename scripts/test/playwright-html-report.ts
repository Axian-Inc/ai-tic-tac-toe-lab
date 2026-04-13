import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { JSDOM } from "jsdom";
import {
  DEFAULT_HTML_REPORT_PATH,
  DEFAULT_JUNIT_PATH,
} from "./playwright-report-paths.ts";

type TestStatus = "passed" | "failed" | "skipped";

const execFileAsync = promisify(execFile);

export type StepReport = {
  index: number;
  name: string;
  status: TestStatus;
  durationMs: number;
  errorSummary?: string;
};

export type TestCaseReport = {
  suiteName: string;
  className: string;
  fixtureName: string;
  testName: string;
  status: TestStatus;
  durationSeconds: number;
  startedAt?: string;
  failureMessage?: string;
  skippedMessage?: string;
  steps: StepReport[];
};

export type ReportSummary = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationSeconds: number;
  startedAt?: string;
};

export type RunMetadata = {
  branchName?: string;
  runId?: string;
};

export type ParsedPlaywrightJUnitReport = {
  sourcePath: string;
  htmlOutputPath: string;
  runMetadata: RunMetadata;
  summary: ReportSummary;
  tests: TestCaseReport[];
};

type ParsedStepMetadata = {
  index: number;
  name: string;
  status: string;
  durationMs: number;
  errorSummary?: string;
};

type ReportMetadataResolutionOptions = {
  env?: NodeJS.ProcessEnv;
  gitBranchResolver?: () => Promise<string | undefined>;
};

type SummaryChartSegment = {
  label: string;
  count: number;
  className: string;
};

const BRANCH_NAME_ENV_KEYS = [
  "GITHUB_HEAD_REF",
  "GITHUB_REF_NAME",
  "CI_COMMIT_REF_NAME",
  "BUILDKITE_BRANCH",
  "BITBUCKET_BRANCH",
  "BRANCH_NAME",
  "APPVEYOR_REPO_BRANCH",
  "VERCEL_GIT_COMMIT_REF",
];

const RUN_ID_ENV_KEYS = [
  "GITHUB_RUN_ID",
  "CI_PIPELINE_ID",
  "BUILDKITE_BUILD_ID",
  "BITBUCKET_BUILD_NUMBER",
  "APPVEYOR_BUILD_ID",
  "BUILD_BUILDID",
  "BUILD_ID",
  "CIRCLE_WORKFLOW_ID",
  "VERCEL_GIT_COMMIT_SHA",
];

function getFirstNonEmptyEnvValue(
  env: NodeJS.ProcessEnv,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

async function getCurrentGitBranch(): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", ["branch", "--show-current"], {
      cwd: process.cwd(),
    });
    const branchName = stdout.trim();
    return branchName || undefined;
  } catch {
    return undefined;
  }
}

export function resolveRunIdentifier(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return getFirstNonEmptyEnvValue(env, RUN_ID_ENV_KEYS);
}

export async function resolveBranchName(
  env: NodeJS.ProcessEnv = process.env,
  gitBranchResolver: () => Promise<string | undefined> = getCurrentGitBranch
): Promise<string | undefined> {
  const ciBranchName = getFirstNonEmptyEnvValue(env, BRANCH_NAME_ENV_KEYS);
  if (ciBranchName) {
    return ciBranchName;
  }

  return gitBranchResolver();
}

export async function resolveRunMetadata(
  options: ReportMetadataResolutionOptions = {}
): Promise<RunMetadata> {
  const env = options.env ?? process.env;

  return {
    branchName: await resolveBranchName(
      env,
      options.gitBranchResolver ?? getCurrentGitBranch
    ),
    runId: resolveRunIdentifier(env),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFirstNonEmptyLine(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().replace(".000Z", "Z");
}

function formatDurationSeconds(value: number): string {
  return `${value.toFixed(2)}s`;
}

function formatDurationMs(value: number): string {
  return `${value}ms`;
}

function renderSummaryField(label: string, value: string | number | undefined): string {
  const renderedValue =
    value === undefined || value === "" ? "Not available" : String(value);

  return `
    <div class="summary-field">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(renderedValue)}</dd>
    </div>
  `;
}

function renderSummaryChart(summary: ReportSummary): string {
  const total = Math.max(summary.total, 1);
  const segments: SummaryChartSegment[] = [
    {
      label: "Passed",
      count: summary.passed,
      className: "chart-segment-passed",
    },
    {
      label: "Failed",
      count: summary.failed,
      className: "chart-segment-failed",
    },
    {
      label: "Skipped",
      count: summary.skipped,
      className: "chart-segment-skipped",
    },
  ];

  return `
    <section class="report-card">
      <h2>Summary Chart</h2>
      <div class="summary-chart" aria-label="Passed, failed, and skipped test totals">
        ${segments
          .map(
            (segment) => `
              <div
                class="chart-segment ${segment.className}"
                style="width: ${(segment.count / total) * 100}%"
                title="${escapeHtml(`${segment.label}: ${segment.count}`)}"
              ></div>
            `
          )
          .join("")}
      </div>
      <div class="summary-chart-legend">
        ${segments
          .map(
            (segment) => `
              <div class="legend-item">
                <span class="legend-swatch ${segment.className}"></span>
                <span>${escapeHtml(segment.label)}: ${segment.count}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderArtifactsCell(testCase: TestCaseReport): string {
  return `
    <div class="artifacts-cell">
      <details class="artifacts-details">
        <summary>File Artifacts</summary>
        <p>See test-results/playwright/artifacts for Playwright attachments and screenshots.</p>
      </details>
    </div>
  `;
}

function renderFailureDetails(testCase: TestCaseReport): string {
  if (testCase.status !== "failed" || !testCase.failureMessage) {
    return "";
  }

  return `
    <tr class="failure-row">
      <td colspan="5">
        <section class="failure-panel" aria-label="Failure details for ${escapeHtml(
          testCase.testName
        )}">
          <h3>Failure Details</h3>
          <div class="failure-summary">
            <strong>Error Summary</strong>
            <p>${escapeHtml(
              getFirstNonEmptyLine(testCase.failureMessage) ?? "No failure summary available."
            )}</p>
          </div>
          <div class="failure-stack">
            <strong>Stack Trace</strong>
            <pre>${escapeHtml(testCase.failureMessage)}</pre>
          </div>
        </section>
      </td>
    </tr>
  `;
}

function renderStepDetails(testCase: TestCaseReport): string {
  return `
    <tr class="steps-row">
      <td colspan="5">
        <details class="detail-panel details-panel">
          <summary>Steps (${testCase.steps.length} steps executed)</summary>
          ${
            testCase.steps.length
              ? `
                <div class="steps-table-wrap">
                  <table class="steps-table">
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${testCase.steps
                        .map(
                          (step) => `
                            <tr>
                              <td>${escapeHtml(`${step.index}. ${step.name}`)}</td>
                              <td><span class="status-pill status-${step.status}">${escapeHtml(step.status)}</span></td>
                              <td>${escapeHtml(formatDurationMs(step.durationMs))}</td>
                              <td>${escapeHtml(step.errorSummary ?? "")}</td>
                            </tr>
                          `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `
              : "<p>No step metadata was recorded for this test.</p>"
          }
        </details>
      </td>
    </tr>
  `;
}

function renderTestRows(report: ParsedPlaywrightJUnitReport): string {
  return report.tests
    .map(
      (testCase) => `
        <tr class="result-row result-row-${testCase.status}">
          <td>${escapeHtml(testCase.testName)}</td>
          <td>${escapeHtml(testCase.fixtureName)}</td>
          <td><span class="status-pill status-${testCase.status}">${escapeHtml(
            testCase.status
          )}</span></td>
          <td>${escapeHtml(formatDateTime(testCase.startedAt))}</td>
          <td>${renderArtifactsCell(testCase)}</td>
        </tr>
        ${renderStepDetails(testCase)}
        ${renderFailureDetails(testCase)}
      `
    )
    .join("");
}

export function renderPlaywrightHtmlReport(
  report: ParsedPlaywrightJUnitReport
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Test Report - Tic Tac Toe</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --surface: #fffdf8;
        --surface-strong: #f6f0e6;
        --border: #d9cbb2;
        --text: #1f2933;
        --muted: #52606d;
        --passed: #2d6a4f;
        --failed: #a61b1b;
        --skipped: #8a6d1f;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top left, rgba(205, 180, 140, 0.2), transparent 28%),
          linear-gradient(180deg, #f8f4ec 0%, var(--bg) 100%);
        color: var(--text);
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }

      h1, h2 {
        margin: 0 0 16px;
        font-weight: 700;
      }

      p {
        margin: 0;
        color: var(--muted);
      }

      .report-header {
        margin-bottom: 24px;
      }

      .report-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 24px rgba(60, 47, 32, 0.08);
        margin-bottom: 20px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .summary-field {
        padding: 12px;
        background: var(--surface-strong);
        border-radius: 12px;
      }

      .summary-field dt {
        margin: 0 0 6px;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }

      .summary-field dd {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
      }

      .summary-chart {
        display: flex;
        min-height: 20px;
        overflow: hidden;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #efe4d0;
      }

      .chart-segment-passed,
      .status-passed {
        background: var(--passed);
      }

      .chart-segment-failed,
      .status-failed {
        background: var(--failed);
      }

      .chart-segment-skipped,
      .status-skipped {
        background: var(--skipped);
      }

      .summary-chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
      }

      .legend-swatch {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 999px;
      }

      .results-table,
      .steps-table {
        width: 100%;
        border-collapse: collapse;
      }

      .results-table {
        table-layout: fixed;
      }

      .results-table th,
      .results-table td,
      .steps-table th,
      .steps-table td {
        padding: 12px 10px;
        text-align: left;
        vertical-align: top;
      }

      .results-table tbody tr.result-row td {
        border-top: 1px solid var(--border);
      }

      .results-table tbody tr.steps-row td,
      .results-table tbody tr.failure-row td {
        border-top: 0;
      }

      .results-table td:nth-child(1) {
        width: 26%;
      }

      .results-table td:nth-child(2) {
        width: 14%;
      }

      .results-table td:nth-child(3) {
        width: 10%;
      }

      .results-table td:nth-child(4) {
        width: 18%;
      }

      .results-table td:nth-child(5) {
        width: 32%;
      }

      .results-table thead th,
      .steps-table thead th {
        border-top: 0;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .steps-table tbody td {
        border-top: 1px solid var(--border);
      }

      .results-table td,
      .steps-table td {
        overflow-wrap: anywhere;
      }

      .status-pill {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        color: white;
        font-size: 0.85rem;
        text-transform: capitalize;
      }

      details {
        border-radius: 10px;
      }

      summary {
        cursor: pointer;
        font-weight: 700;
      }

      .artifacts-cell {
        width: 100%;
        display: grid;
        gap: 10px;
      }

      .artifacts-details > summary,
      .detail-panel > summary {
        list-style-position: outside;
      }

      .artifacts-details,
      .detail-panel {
        padding: 10px 12px;
        background: var(--surface-strong);
        width: 100%;
        border-radius: 10px;
      }

      .artifacts-details p {
        margin-top: 8px;
      }

      .steps-table-wrap {
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
      }

      .steps-row td,
      .failure-row td {
        padding-top: 0;
      }

      .detail-panel summary {
        font-weight: 700;
      }

      .failure-panel {
        border: 1px solid #d84f4f;
        background: #fff1f1;
        border-radius: 14px;
        padding: 16px;
        box-shadow: inset 0 0 0 1px rgba(166, 27, 27, 0.08);
      }

      .failure-panel h3 {
        margin: 0 0 12px;
        color: var(--failed);
        font-size: 1rem;
      }

      .failure-summary,
      .failure-stack {
        margin-top: 12px;
      }

      .failure-summary {
        background: #ffe0e0;
        border-radius: 10px;
        padding: 12px;
      }

      .failure-summary p {
        margin-top: 8px;
        color: #6f1d1b;
      }

      .failure-stack pre {
        margin: 8px 0 0;
        padding: 12px;
        background: #7f1d1d;
        color: #fff7f7;
        border-radius: 10px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 0.85rem;
      }

      @media (max-width: 820px) {
        .results-table,
        .results-table thead,
        .results-table tbody,
        .results-table th,
        .results-table td,
        .results-table tr {
          display: block;
        }

        .results-table thead {
          display: none;
        }

        .results-table tr {
          margin-bottom: 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface-strong);
          padding: 10px;
        }

        .results-table td {
          border-top: 0;
          padding: 8px 0;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="report-header">
        <h1>Test Report - Tic Tac Toe</h1>
        <p>Standalone Playwright UI automation report rendered from the final JUnit artifact.</p>
      </header>

      <section class="report-card">
        <h2>Run Summary</h2>
        <dl class="summary-grid">
          ${renderSummaryField("Run Identifier", report.runMetadata.runId)}
          ${renderSummaryField("Time Run Started", formatDateTime(report.summary.startedAt))}
          ${renderSummaryField("Branch Name", report.runMetadata.branchName)}
          ${renderSummaryField("Total Tests", report.summary.total)}
          ${renderSummaryField("Passed", report.summary.passed)}
          ${renderSummaryField("Failed", report.summary.failed)}
          ${renderSummaryField("Skipped", report.summary.skipped)}
        </dl>
      </section>

      ${renderSummaryChart(report.summary)}

      <section class="report-card">
        <h2>Results</h2>
        <table class="results-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Fixture Name</th>
              <th>Status</th>
              <th>Time of Test Execution</th>
              <th>Artifacts</th>
            </tr>
          </thead>
          <tbody>
            ${renderTestRows(report)}
          </tbody>
        </table>
      </section>
    </main>
  </body>
</html>`;
}

function parseDuration(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeFixtureName(className: string, suiteName: string): string {
  const source = className || suiteName;
  const basename = source.split("/").at(-1) ?? source;
  return basename.replace(/(\.spec)?\.[^.]+$/, "");
}

function getDirectChildElements(
  parent: Element,
  tagName: string
): Element[] {
  return Array.from(parent.children).filter((child) => child.tagName === tagName);
}

function getFirstDirectChild(parent: Element, tagName: string): Element | undefined {
  return getDirectChildElements(parent, tagName)[0];
}

function getElementText(element: Element | undefined): string | undefined {
  const text = element?.textContent?.trim();
  return text ? text : undefined;
}

function getParserError(document: Document): string | undefined {
  const parserError = document.getElementsByTagName("parsererror")[0];
  return parserError?.textContent?.trim() || undefined;
}

function parseStepMetadata(
  testCaseElement: Element,
  testName: string
): StepReport[] {
  const propertiesElement = getFirstDirectChild(testCaseElement, "properties");
  const propertyElements = propertiesElement
    ? getDirectChildElements(propertiesElement, "property")
    : [];

  const metadataProperty = propertyElements.find(
    (property) => property.getAttribute("name") === "pw:step-metadata"
  );

  const rawValue = metadataProperty?.getAttribute("value");
  if (!rawValue) {
    return [];
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(rawValue);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown JSON parse failure";
    throw new Error(
      `Unable to parse pw:step-metadata for testcase "${testName}": ${message}`
    );
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(
      `Invalid pw:step-metadata for testcase "${testName}": expected an array`
    );
  }

  return parsedValue.map((entry, index) => {
    const step = entry as ParsedStepMetadata;

    return {
      index:
        typeof step.index === "number" && Number.isFinite(step.index)
          ? step.index
          : index + 1,
      name: typeof step.name === "string" ? step.name : `Step ${index + 1}`,
      status:
        step.status === "failed"
          ? "failed"
          : step.status === "skipped"
            ? "skipped"
            : "passed",
      durationMs:
        typeof step.durationMs === "number" && Number.isFinite(step.durationMs)
          ? step.durationMs
          : 0,
      errorSummary:
        typeof step.errorSummary === "string" && step.errorSummary.trim().length > 0
          ? step.errorSummary.trim()
          : undefined,
    };
  });
}

function inferTestStatus(testCaseElement: Element): TestStatus {
  if (getFirstDirectChild(testCaseElement, "failure")) {
    return "failed";
  }

  if (getFirstDirectChild(testCaseElement, "skipped")) {
    return "skipped";
  }

  return "passed";
}

export function parsePlaywrightJUnitXml(
  xml: string,
  sourcePath = DEFAULT_JUNIT_PATH,
  htmlOutputPath = DEFAULT_HTML_REPORT_PATH
): ParsedPlaywrightJUnitReport {
  const dom = new JSDOM(xml, {
    contentType: "text/xml",
  });
  const parserError = getParserError(dom.window.document);
  if (parserError) {
    throw new Error(`Invalid Playwright JUnit XML: ${parserError}`);
  }

  const testsuites = dom.window.document.documentElement;

  if (!testsuites || testsuites.tagName !== "testsuites") {
    throw new Error("Expected a <testsuites> root element in Playwright JUnit XML");
  }

  const suiteElements = getDirectChildElements(testsuites, "testsuite");
  const tests: TestCaseReport[] = [];

  for (const suiteElement of suiteElements) {
    const suiteName = suiteElement.getAttribute("name") ?? "unknown-suite";
    const startedAt = suiteElement.getAttribute("timestamp") ?? undefined;
    const testCaseElements = getDirectChildElements(suiteElement, "testcase");

    for (const testCaseElement of testCaseElements) {
      const testName = testCaseElement.getAttribute("name") ?? "Unnamed testcase";
      const className = testCaseElement.getAttribute("classname") ?? suiteName;
      const status = inferTestStatus(testCaseElement);
      const failureMessage = getElementText(getFirstDirectChild(testCaseElement, "failure"));
      const skippedMessage = getElementText(getFirstDirectChild(testCaseElement, "skipped"));

      tests.push({
        suiteName,
        className,
        fixtureName: normalizeFixtureName(className, suiteName),
        testName,
        status,
        durationSeconds: parseDuration(testCaseElement.getAttribute("time")),
        startedAt,
        failureMessage,
        skippedMessage,
        steps: parseStepMetadata(testCaseElement, testName),
      });
    }
  }

  const summary: ReportSummary = {
    total: tests.length,
    passed: tests.filter((test) => test.status === "passed").length,
    failed: tests.filter((test) => test.status === "failed").length,
    skipped: tests.filter((test) => test.status === "skipped").length,
    durationSeconds: parseDuration(testsuites.getAttribute("time")),
    startedAt:
      suiteElements
        .map((suiteElement) => suiteElement.getAttribute("timestamp") ?? undefined)
        .filter((value): value is string => Boolean(value))
        .sort()[0] ?? undefined,
  };

  return {
    sourcePath,
    htmlOutputPath,
    runMetadata: {},
    summary,
    tests,
  };
}

export async function readPlaywrightJUnitReport(
  junitPath = DEFAULT_JUNIT_PATH,
  htmlOutputPath = DEFAULT_HTML_REPORT_PATH,
  metadataOptions: ReportMetadataResolutionOptions = {}
): Promise<ParsedPlaywrightJUnitReport> {
  const xml = await readFile(junitPath, "utf8");
  const report = parsePlaywrightJUnitXml(xml, junitPath, htmlOutputPath);

  return {
    ...report,
    runMetadata: await resolveRunMetadata(metadataOptions),
  };
}

export async function writePlaywrightHtmlReport(
  report: ParsedPlaywrightJUnitReport
): Promise<string> {
  const html = renderPlaywrightHtmlReport(report);
  await mkdir(path.dirname(report.htmlOutputPath), {
    recursive: true,
  });
  await writeFile(report.htmlOutputPath, html, "utf8");
  return report.htmlOutputPath;
}

export type CliOptions = {
  junitPath: string;
  htmlOutputPath: string;
};

export function parseCliOptions(argv: string[]): CliOptions {
  let junitPath = DEFAULT_JUNIT_PATH;
  let htmlOutputPath = DEFAULT_HTML_REPORT_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--junit") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --junit");
      }

      junitPath = path.resolve(process.cwd(), nextValue);
      index += 1;
      continue;
    }

    if (argument === "--html") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --html");
      }

      htmlOutputPath = path.resolve(process.cwd(), nextValue);
      index += 1;
      continue;
    }

    if (!argument.startsWith("--")) {
      junitPath = path.resolve(process.cwd(), argument);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    junitPath,
    htmlOutputPath,
  };
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const report = await readPlaywrightJUnitReport(
    options.junitPath,
    options.htmlOutputPath
  );
  await writePlaywrightHtmlReport(report);

  console.log(
    JSON.stringify(
      {
        sourcePath: report.sourcePath,
        htmlOutputPath: report.htmlOutputPath,
        runMetadata: report.runMetadata,
        summary: report.summary,
      },
      null,
      2
    )
  );
}

const entryArg = process.argv[1];

if (entryArg && import.meta.url === pathToFileURL(entryArg).href) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
