import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  DEFAULT_HTML_REPORT_PATH,
  DEFAULT_JUNIT_PATH,
} from "../../scripts/test/playwright-report-paths.ts";
import {
  parseCliOptions,
  parsePlaywrightJUnitXml,
} from "../../scripts/test/playwright-html-report.ts";

function buildJUnitXml(testCases: string): string {
  return `
    <testsuites id="" name="tic-tac-toe" tests="3" failures="1" skipped="1" errors="0" time="12.5">
      <testsuite
        name="e2e/sample-flow.spec.ts"
        timestamp="2026-04-13T02:00:00.000Z"
        hostname="chromium"
        tests="3"
        failures="1"
        skipped="1"
        time="4.5"
        errors="0"
      >
        ${testCases}
      </testsuite>
    </testsuites>
  `;
}

test.describe("parsePlaywrightJUnitXml", () => {
  test("parses passed, failed, and skipped tests with summary totals", () => {
    const xml = buildJUnitXml(`
      <testcase name="passed case" classname="e2e/sample-flow.spec.ts" time="1.25">
        <properties>
          <property
            name="pw:step-metadata"
            value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Step one&quot;,&quot;status&quot;:&quot;passed&quot;,&quot;durationMs&quot;:125}]"
          />
        </properties>
      </testcase>
      <testcase name="failed case" classname="e2e/sample-flow.spec.ts" time="2.5">
        <properties>
          <property
            name="pw:step-metadata"
            value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Failing step&quot;,&quot;status&quot;:&quot;failed&quot;,&quot;durationMs&quot;:250,&quot;errorSummary&quot;:&quot;Expected false to be true&quot;}]"
          />
        </properties>
        <failure message="failed case message" type="FAILURE"><![CDATA[Full failure body]]></failure>
      </testcase>
      <testcase name="skipped case" classname="e2e/sample-flow.spec.ts" time="0">
        <skipped><![CDATA[Skipped for maintenance]]></skipped>
      </testcase>
    `);

    const report = parsePlaywrightJUnitXml(xml);

    expect(report.summary).toEqual({
      total: 3,
      passed: 1,
      failed: 1,
      skipped: 1,
      durationSeconds: 12.5,
      startedAt: "2026-04-13T02:00:00.000Z",
    });

    expect(report.tests).toHaveLength(3);
    expect(report.tests.map((testCase) => testCase.status)).toEqual([
      "passed",
      "failed",
      "skipped",
    ]);
  });

  test("parses embedded step metadata including failed-step error summaries", () => {
    const xml = buildJUnitXml(`
      <testcase name="failed case" classname="e2e/sample-flow.spec.ts" time="2.5">
        <properties>
          <property
            name="pw:step-metadata"
            value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Prepare state&quot;,&quot;status&quot;:&quot;passed&quot;,&quot;durationMs&quot;:100},{&quot;index&quot;:2,&quot;name&quot;:&quot;Submit failing action&quot;,&quot;status&quot;:&quot;failed&quot;,&quot;durationMs&quot;:250,&quot;errorSummary&quot;:&quot;Error: expected 200 to be 500&quot;}]"
          />
        </properties>
        <failure message="failed case message" type="FAILURE"><![CDATA[Full failure body]]></failure>
      </testcase>
    `);

    const report = parsePlaywrightJUnitXml(xml);

    expect(report.tests[0]).toMatchObject({
      status: "failed",
      failureMessage: "Full failure body",
      steps: [
        {
          index: 1,
          name: "Prepare state",
          status: "passed",
          durationMs: 100,
        },
        {
          index: 2,
          name: "Submit failing action",
          status: "failed",
          durationMs: 250,
          errorSummary: "Error: expected 200 to be 500",
        },
      ],
    });
  });

  test("infers fixture name from the testcase classname", () => {
    const xml = buildJUnitXml(`
      <testcase name="fixture inference case" classname="e2e/multiplayer-errors.spec.ts" time="1.1" />
    `);

    const report = parsePlaywrightJUnitXml(xml);

    expect(report.tests[0]?.fixtureName).toBe("multiplayer-errors");
  });

  test("uses the configured junit and html artifact paths in the normalized report", () => {
    const xml = buildJUnitXml(`
      <testcase name="artifact path case" classname="e2e/sample-flow.spec.ts" time="0.1" />
    `);

    const junitPath = "/tmp/custom-junit.xml";
    const htmlPath = "/tmp/custom-report.html";
    const report = parsePlaywrightJUnitXml(xml, junitPath, htmlPath);

    expect(report.sourcePath).toBe(junitPath);
    expect(report.htmlOutputPath).toBe(htmlPath);
  });

  test("throws for malformed xml input", () => {
    expect(() =>
      parsePlaywrightJUnitXml("<testsuites><testsuite></testsuites>")
    ).toThrow(/unexpected close tag/i);
  });

  test("throws when pw:step-metadata is invalid json", () => {
    const xml = buildJUnitXml(`
      <testcase name="invalid step json" classname="e2e/sample-flow.spec.ts" time="0.1">
        <properties>
          <property name="pw:step-metadata" value="not-json" />
        </properties>
      </testcase>
    `);

    expect(() => parsePlaywrightJUnitXml(xml)).toThrow(
      /Unable to parse pw:step-metadata/
    );
  });
});

test.describe("parseCliOptions", () => {
  test("uses the default junit and html artifact paths when no args are provided", () => {
    expect(parseCliOptions([])).toEqual({
      junitPath: DEFAULT_JUNIT_PATH,
      htmlOutputPath: DEFAULT_HTML_REPORT_PATH,
    });
  });

  test("supports explicit junit and html path overrides", () => {
    expect(
      parseCliOptions([
        "--junit",
        "tmp/results.xml",
        "--html",
        "tmp/report.html",
      ])
    ).toEqual({
      junitPath: path.resolve(process.cwd(), "tmp/results.xml"),
      htmlOutputPath: path.resolve(process.cwd(), "tmp/report.html"),
    });
  });

  test("treats a positional argument as the junit path", () => {
    expect(parseCliOptions(["relative/junit.xml"])).toEqual({
      junitPath: path.resolve(process.cwd(), "relative/junit.xml"),
      htmlOutputPath: DEFAULT_HTML_REPORT_PATH,
    });
  });

  test("throws for unknown arguments", () => {
    expect(() => parseCliOptions(["--nope"])).toThrow(/Unknown argument/);
  });

  test("throws when --junit or --html is missing a value", () => {
    expect(() => parseCliOptions(["--junit"])).toThrow(/Missing value for --junit/);
    expect(() => parseCliOptions(["--html"])).toThrow(/Missing value for --html/);
  });
});
