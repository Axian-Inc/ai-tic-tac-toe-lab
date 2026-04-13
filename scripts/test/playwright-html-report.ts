import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { JSDOM } from "jsdom";
import {
  DEFAULT_HTML_REPORT_PATH,
  DEFAULT_JUNIT_PATH,
} from "./playwright-report-paths.ts";

type TestStatus = "passed" | "failed" | "skipped";

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

export type ParsedPlaywrightJUnitReport = {
  sourcePath: string;
  htmlOutputPath: string;
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
    summary,
    tests,
  };
}

export async function readPlaywrightJUnitReport(
  junitPath = DEFAULT_JUNIT_PATH,
  htmlOutputPath = DEFAULT_HTML_REPORT_PATH
): Promise<ParsedPlaywrightJUnitReport> {
  const xml = await readFile(junitPath, "utf8");
  return parsePlaywrightJUnitXml(xml, junitPath, htmlOutputPath);
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

  console.log(
    JSON.stringify(
      {
        sourcePath: report.sourcePath,
        htmlOutputPath: report.htmlOutputPath,
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
