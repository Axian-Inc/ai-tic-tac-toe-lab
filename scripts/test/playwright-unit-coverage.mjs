import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mergeProcessCovs } from "@bcoe/v8-coverage";
import { convert } from "ast-v8-to-istanbul";
import libCoverage from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";
import reports from "istanbul-reports";
import ts from "typescript";
import { parseAstAsync } from "vite";

const require = createRequire(import.meta.url);

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const coverageDirectory = path.join(repoRoot, "coverage");
const rawCoverageDirectory = path.join(coverageDirectory, "raw-playwright-v8");
const playwrightCli = require.resolve("@playwright/test/cli");

function isCoveredProjectFile(url) {
  if (!url.startsWith("file://")) {
    return false;
  }

  const filename = fileURLToPath(url);
  const relativePath = path.relative(repoRoot, filename);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return false;
  }

  return (
    relativePath.startsWith("src/") ||
    relativePath.startsWith("server/") ||
    relativePath.startsWith("scripts/")
  );
}

async function runPlaywrightUnitTestsWithCoverage() {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [playwrightCli, "test", "tests/unit"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_V8_COVERAGE: rawCoverageDirectory,
      },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 1);
    });
  });
}

async function loadMergedCoverage() {
  const coverageFiles = (await readdir(rawCoverageDirectory))
    .filter((filename) => filename.endsWith(".json"))
    .sort();

  if (coverageFiles.length === 0) {
    throw new Error("Playwright did not produce any V8 coverage files.");
  }

  let merged = { result: [] };

  for (const coverageFile of coverageFiles) {
    const rawCoverage = JSON.parse(
      await readFile(path.join(rawCoverageDirectory, coverageFile), "utf8")
    );
    merged = mergeProcessCovs([merged, rawCoverage]);
  }

  return merged;
}

async function generateCoverageReport() {
  const mergedCoverage = await loadMergedCoverage();
  const coverageMap = libCoverage.createCoverageMap({});

  for (const result of mergedCoverage.result) {
    const url = String(result.url ?? "");

    if (!isCoveredProjectFile(url)) {
      continue;
    }

    const filename = fileURLToPath(url);
    const originalCode = await readFile(filename, "utf8");
    const extension = path.extname(filename);
    const shouldTransformTypescript =
      extension === ".ts" ||
      extension === ".tsx" ||
      extension === ".mts" ||
      extension === ".cts";
    const transformedSource = shouldTransformTypescript
      ? (() => {
          const transpiled = ts.transpileModule(originalCode, {
            compilerOptions: {
              jsx: ts.JsxEmit.ReactJSX,
              module: ts.ModuleKind.ESNext,
              sourceMap: true,
              target: ts.ScriptTarget.ESNext,
              verbatimModuleSyntax: true,
            },
            fileName: filename,
          });

          return {
            code: transpiled.outputText,
            map: transpiled.sourceMapText,
          };
        })()
      : {
          code: originalCode,
          map: null,
        };
    const ast = await parseAstAsync(transformedSource.code);
    const converted = await convert({
      ast,
      code: transformedSource.code,
      coverage: {
        url,
        functions: Array.isArray(result.functions) ? result.functions : [],
      },
      sourceMap:
        typeof transformedSource.map === "string"
          ? JSON.parse(transformedSource.map)
          : undefined,
      wrapperLength: Number(result.startOffset ?? 0),
    });

    coverageMap.merge(converted);
  }

  if (coverageMap.files().length === 0) {
    throw new Error("No project source files were included in Playwright coverage.");
  }

  const context = libReport.createContext({
    coverageMap,
    dir: coverageDirectory,
  });

  reports.create("text", { projectRoot: repoRoot }).execute(context);
  reports.create("html", { projectRoot: repoRoot }).execute(context);
  reports.create("lcovonly", { file: "lcov.info", projectRoot: repoRoot }).execute(
    context
  );
}

async function main() {
  await rm(coverageDirectory, { force: true, recursive: true });
  await mkdir(rawCoverageDirectory, { recursive: true });

  const exitCode = await runPlaywrightUnitTestsWithCoverage();

  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  await generateCoverageReport();
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
