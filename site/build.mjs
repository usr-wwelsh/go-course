import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

const outdir = "dist";
const watch = process.argv.includes("--watch");

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

function stage() {
  cpSync("index.html", `${outdir}/index.html`);
  cpSync("src/styles.css", `${outdir}/styles.css`);
  cpSync("public", outdir, { recursive: true });
  cpSync("static", outdir, { recursive: true });
  cpSync("../content", `${outdir}/content`, { recursive: true });
}

const shared = {
  bundle: true,
  outdir,
  target: "es2022",
  sourcemap: true,
  logLevel: "info",
};

// main.ts is loaded as <script type="module">, so it bundles as ESM.
// worker.ts must be a *classic* worker script (new Worker(url), no
// { type: "module" }) because it uses importScripts() to load
// wasm_exec.js — that API is disallowed inside module workers.
const configs = [
  { ...shared, entryPoints: ["src/main.ts"], format: "esm" },
  { ...shared, entryPoints: ["src/worker.ts"], format: "iife" },
];

stage();

if (watch) {
  const ctxs = await Promise.all(configs.map((c) => esbuild.context(c)));
  await Promise.all(ctxs.map((ctx) => ctx.watch()));
  console.log("watching for changes...");
} else {
  await Promise.all(configs.map((c) => esbuild.build(c)));
  console.log(`built ${outdir}`);
}
