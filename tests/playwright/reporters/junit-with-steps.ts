import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import { createRequire } from "node:module";
import path from "node:path";

type XmlEntry = {
  name: string;
  attributes?: Record<string, string | number>;
  children?: XmlEntry[];
  text?: string;
};

type StepMetadata = {
  name: string;
  status: "passed" | "failed";
  durationMs: number;
  errorSummary?: string;
};

type ReporterClass = new (options: Record<string, unknown>) => Reporter & {
  _addTestCase: (
    suiteName: string,
    namePrefix: string,
    test: TestCase,
    entries: XmlEntry[]
  ) => Promise<void>;
  onEnd?: (result: FullResult) => Promise<void>;
};

const require = createRequire(import.meta.url);
const BaseJUnitReporter = require(
  path.resolve(process.cwd(), "node_modules/playwright/lib/reporters/junit.js")
).default as ReporterClass;

function stripAnsi(value: string): string {
  return value.replace(
    // Matches common ANSI escape sequences used in Playwright/Jest-style output.
    /\u001B\[[0-9;]*[A-Za-z]/g,
    ""
  );
}

function toConciseLine(value: string): string | undefined {
  const firstContentLine = stripAnsi(value)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstContentLine || undefined;
}

function summarizeStepError(error: TestStep["error"]): string | undefined {
  if (!error) {
    return undefined;
  }

  const message = error.message?.trim();
  if (message) {
    return toConciseLine(message);
  }

  const value = error.value?.trim();
  if (value) {
    return toConciseLine(value);
  }

  return undefined;
}

function getOrCreateProperties(entry: XmlEntry): XmlEntry {
  entry.children ??= [];

  const existing = entry.children.find((child) => child.name === "properties");
  if (existing) {
    existing.children ??= [];
    return existing;
  }

  const properties: XmlEntry = {
    name: "properties",
    children: [],
  };

  entry.children.unshift(properties);
  return properties;
}

export default class JUnitWithStepsReporter extends BaseJUnitReporter {
  private readonly stepMetadataByResult = new WeakMap<TestResult, StepMetadata[]>();

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    if (step.category !== "test.step") {
      return;
    }

    const existingSteps = this.stepMetadataByResult.get(result) ?? [];
    existingSteps.push({
      name: step.title,
      status: step.error ? "failed" : "passed",
      durationMs: step.duration,
      errorSummary: summarizeStepError(step.error),
    });
    this.stepMetadataByResult.set(result, existingSteps);
  }

  async _addTestCase(
    suiteName: string,
    namePrefix: string,
    test: TestCase,
    entries: XmlEntry[]
  ): Promise<void> {
    await super._addTestCase(suiteName, namePrefix, test, entries);

    const entry = entries.at(-1);
    if (!entry) {
      return;
    }

    const orderedSteps = test.results.flatMap((result) =>
      (this.stepMetadataByResult.get(result) ?? []).map((step, index) => ({
        index: index + 1,
        name: step.name,
        status: step.status,
        durationMs: step.durationMs,
        ...(step.errorSummary ? { errorSummary: step.errorSummary } : {}),
      }))
    );

    if (!orderedSteps.length) {
      return;
    }

    const properties = getOrCreateProperties(entry);
    properties.children!.push({
      name: "property",
      attributes: {
        name: "pw:step-metadata",
        value: JSON.stringify(
          orderedSteps.map((step, index) => ({
            ...step,
            index: index + 1,
          }))
        ),
      },
    });
  }
}
