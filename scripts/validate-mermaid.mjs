import path from 'node:path';
import process from 'node:process';
import { readdir, readFile } from 'node:fs/promises';

import { JSDOM } from 'jsdom';

const diagramsDir = process.argv[2] ?? 'docs/diagrams';
const resolvedDir = path.resolve(diagramsDir);

const dom = new JSDOM('');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Node = dom.window.Node;
globalThis.navigator = dom.window.navigator;

const mermaid = (await import('mermaid')).default;
const parseFn = mermaid.parse ?? mermaid.mermaidAPI?.parse;
if (!parseFn) {
  console.error('Mermaid parse API not found.');
  process.exit(2);
}

const entries = await readdir(resolvedDir, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.mmd'))
  .map((entry) => path.join(resolvedDir, entry.name));

if (files.length === 0) {
  console.error(`No .mmd files found in ${resolvedDir}`);
  process.exit(1);
}

let hasErrors = false;

for (const file of files) {
  const contents = await readFile(file, 'utf8');
  try {
    const result = parseFn(contents);
    if (result && typeof result.then === 'function') {
      await result;
    }
    console.log(`OK ${file}`);
  } catch (error) {
    hasErrors = true;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${file}: ${message}`);
  }
}

if (hasErrors) {
  process.exit(1);
}
