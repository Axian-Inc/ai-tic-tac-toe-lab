import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  DEFAULT_HTML_REPORT_PATH,
  DEFAULT_JUNIT_PATH,
} from "../../scripts/test/playwright-report-paths.ts";
import {
  parseCliOptions,
  parsePlaywrightJUnitXml,
  readPlaywrightJUnitReport,
  renderPlaywrightHtmlReport,
  resolveBranchName,
  resolveRunIdentifier,
  resolveRunMetadata,
  writePlaywrightHtmlReport,
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
    expect(report.runMetadata).toEqual({});
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

test.describe("report metadata resolution", () => {
  test("prefers CI branch environment variables over git branch fallback", async () => {
    const gitBranchResolver = async (): Promise<string | undefined> => "local-branch";

    await expect(
      resolveBranchName(
        {
          GITHUB_HEAD_REF: "feature/from-ci",
        },
        gitBranchResolver
      )
    ).resolves.toBe("feature/from-ci");
  });

  test("falls back to git branch resolution when CI branch metadata is unavailable", async () => {
    const gitBranchResolver = async (): Promise<string | undefined> => "local-feature";

    await expect(resolveBranchName({}, gitBranchResolver)).resolves.toBe(
      "local-feature"
    );
  });

  test("returns undefined branch metadata when neither CI nor git can provide it", async () => {
    const gitBranchResolver = async (): Promise<string | undefined> => undefined;

    await expect(resolveBranchName({}, gitBranchResolver)).resolves.toBeUndefined();
  });

  test("resolves run identifier from CI environment variables when available", () => {
    expect(
      resolveRunIdentifier({
        GITHUB_RUN_ID: "123456789",
      })
    ).toBe("123456789");
  });

  test("returns undefined run identifier when CI metadata is unavailable", () => {
    expect(resolveRunIdentifier({})).toBeUndefined();
  });

  test("combines resolved branch and run metadata into the report model shape", async () => {
    const metadata = await resolveRunMetadata({
      env: {
        GITHUB_REF_NAME: "phase-10-html-report",
        GITHUB_RUN_ID: "98765",
      },
      gitBranchResolver: async (): Promise<string | undefined> => "local-branch",
    });

    expect(metadata).toEqual({
      branchName: "phase-10-html-report",
      runId: "98765",
    });
  });
});

test.describe("renderPlaywrightHtmlReport", () => {
  test("renders the report header, run summary, chart, and result rows", () => {
    const xml = buildJUnitXml(`
      <testcase name="passed case" classname="e2e/sample-flow.spec.ts" time="1.25">
        <properties>
          <property
            name="pw:step-metadata"
            value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Open landing page&quot;,&quot;status&quot;:&quot;passed&quot;,&quot;durationMs&quot;:125}]"
          />
        </properties>
      </testcase>
      <testcase name="failed case" classname="e2e/sample-flow.spec.ts" time="2.5">
        <properties>
          <property
            name="pw:step-metadata"
            value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Prepare state&quot;,&quot;status&quot;:&quot;passed&quot;,&quot;durationMs&quot;:100},{&quot;index&quot;:2,&quot;name&quot;:&quot;Submit failing action&quot;,&quot;status&quot;:&quot;failed&quot;,&quot;durationMs&quot;:250,&quot;errorSummary&quot;:&quot;Expected false to be true&quot;}]"
          />
        </properties>
        <failure message="failed case message" type="FAILURE"><![CDATA[Full failure body]]></failure>
      </testcase>
      <testcase name="skipped case" classname="e2e/sample-flow.spec.ts" time="0">
        <skipped><![CDATA[Skipped for maintenance]]></skipped>
      </testcase>
    `);

    const html = renderPlaywrightHtmlReport({
      ...parsePlaywrightJUnitXml(xml),
      runMetadata: {
        branchName: "phase-10-html-report",
        runId: "12345",
      },
    });

    expect(html).toContain("<title>Test Report - Tic Tac Toe</title>");
    expect(html).toContain("<h1>Test Report - Tic Tac Toe</h1>");
    expect(html).toContain("Run Summary");
    expect(html).toContain("Summary Chart");
    expect(html).toContain('class="summary-chart"');
    expect(html).toContain("phase-10-html-report");
    expect(html).toContain("12345");
    expect(html).toContain("passed case");
    expect(html).toContain("failed case");
    expect(html).toContain("skipped case");
    expect(html).toContain("Artifacts");
    expect(html).toContain("File Artifacts");
    expect(html).toContain("Steps (2 steps executed)");
    expect(html).toContain("Expected false to be true");
    expect(html).toContain("test-results/playwright/artifacts");
  });

  test("renders not-available placeholders when optional run metadata is missing", () => {
    const xml = buildJUnitXml(`
      <testcase name="artifact path case" classname="e2e/sample-flow.spec.ts" time="0.1" />
    `);

    const html = renderPlaywrightHtmlReport(parsePlaywrightJUnitXml(xml));

    expect(html).toContain("Run Identifier");
    expect(html).toContain("Branch Name");
    expect(html).toContain("Not available");
  });

  test("escapes user-provided text in rendered HTML", () => {
    const xml = buildJUnitXml(`
      <testcase name="unsafe &lt;case&gt;" classname="e2e/sample-flow.spec.ts" time="0.1">
        <properties>
          <property
            name="pw:step-metadata"
            value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Render &lt;unsafe&gt; step&quot;,&quot;status&quot;:&quot;failed&quot;,&quot;durationMs&quot;:25,&quot;errorSummary&quot;:&quot;&lt;script&gt;boom&lt;/script&gt;&quot;}]"
          />
        </properties>
        <failure message="failed case message" type="FAILURE"><![CDATA[Full failure body]]></failure>
      </testcase>
    `);

    const html = renderPlaywrightHtmlReport(parsePlaywrightJUnitXml(xml));

    expect(html).toContain("unsafe &lt;case&gt;");
    expect(html).toContain("Render &lt;unsafe&gt; step");
    expect(html).toContain("&lt;script&gt;boom&lt;/script&gt;");
    expect(html).not.toContain("<script>boom</script>");
  });
});

test.describe("writePlaywrightHtmlReport", () => {
  test("writes the rendered HTML to the configured output path", async () => {
    const tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "playwright-html-report-")
    );

    try {
      const report = {
        ...parsePlaywrightJUnitXml(
          buildJUnitXml(`
            <testcase name="written case" classname="e2e/sample-flow.spec.ts" time="0.1" />
          `),
          path.join(tempDirectory, "junit.xml"),
          path.join(tempDirectory, "nested", "report.html")
        ),
        runMetadata: {
          branchName: "write-test-branch",
          runId: "run-42",
        },
      };

      const writtenPath = await writePlaywrightHtmlReport(report);
      const writtenHtml = await readFile(writtenPath, "utf8");

      expect(writtenPath).toBe(path.join(tempDirectory, "nested", "report.html"));
      expect(writtenHtml).toContain("<h1>Test Report - Tic Tac Toe</h1>");
      expect(writtenHtml).toContain("written case");
      expect(writtenHtml).toContain("write-test-branch");
      expect(writtenHtml).toContain("run-42");
    } finally {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
});

test.describe("file-based report generation flow", () => {
  test("reads junit from disk, preserves failed-step summaries, and writes useful html without branch or run metadata", async () => {
    const tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "playwright-html-report-flow-")
    );

    try {
      const junitPath = path.join(tempDirectory, "junit.xml");
      const htmlPath = path.join(tempDirectory, "report.html");
      const junitXml = buildJUnitXml(`
        <testcase name="passed case" classname="e2e/sample-flow.spec.ts" time="1.25">
          <properties>
            <property
              name="pw:step-metadata"
              value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Open landing page&quot;,&quot;status&quot;:&quot;passed&quot;,&quot;durationMs&quot;:125}]"
            />
          </properties>
        </testcase>
        <testcase name="failed case" classname="e2e/sample-flow.spec.ts" time="2.5">
          <properties>
            <property
              name="pw:step-metadata"
              value="[{&quot;index&quot;:1,&quot;name&quot;:&quot;Prepare state&quot;,&quot;status&quot;:&quot;passed&quot;,&quot;durationMs&quot;:100},{&quot;index&quot;:2,&quot;name&quot;:&quot;Submit failing action&quot;,&quot;status&quot;:&quot;failed&quot;,&quot;durationMs&quot;:250,&quot;errorSummary&quot;:&quot;Expected false to be true&quot;}]"
            />
          </properties>
          <failure message="failed case message" type="FAILURE"><![CDATA[Full failure body]]></failure>
        </testcase>
        <testcase name="skipped case" classname="e2e/sample-flow.spec.ts" time="0">
          <skipped><![CDATA[Skipped for maintenance]]></skipped>
        </testcase>
      `);

      await writeFile(junitPath, junitXml, "utf8");

      const report = await readPlaywrightJUnitReport(junitPath, htmlPath, {
        env: {},
        gitBranchResolver: async (): Promise<string | undefined> => undefined,
      });

      expect(report.summary).toEqual({
        total: 3,
        passed: 1,
        failed: 1,
        skipped: 1,
        durationSeconds: 12.5,
        startedAt: "2026-04-13T02:00:00.000Z",
      });
      expect(report.runMetadata).toEqual({
        branchName: undefined,
        runId: undefined,
      });
      expect(report.tests[1]?.steps[1]?.errorSummary).toBe("Expected false to be true");

      await writePlaywrightHtmlReport(report);

      const html = await readFile(htmlPath, "utf8");
      expect(html).toContain("passed case");
      expect(html).toContain("failed case");
      expect(html).toContain("skipped case");
      expect(html).toContain("Steps (2 steps executed)");
      expect(html).toContain("Expected false to be true");
      expect(html).toContain("Not available");
    } finally {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
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
