import { mkdir, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const shared = {
  bundle: true,
  entryNames: "[dir]/[name]",
  format: "cjs",
  minify: false,
  outdir: "dist",
  outbase: "src",
  platform: "node",
  sourcemap: true,
  target: "node22",
};

await rm("dist", { recursive: true, force: true });

await build({
  ...shared,
  entryPoints: [
    "src/handlers/http.ts",
    "src/handlers/ws-connect.ts",
    "src/handlers/ws-disconnect.ts",
    "src/handlers/ws-default.ts",
  ],
});

await mkdir("dist", { recursive: true });
await writeFile("dist/package.json", `${JSON.stringify({ type: "commonjs" })}\n`);
