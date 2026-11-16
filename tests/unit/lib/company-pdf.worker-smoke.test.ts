import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
import { build } from "vite";
import { afterAll, describe, expect, it } from "vitest";

const root = process.cwd();
const outDir = mkdtempSync(path.join(tmpdir(), "company-pdf-worker-"));
let miniflare: Miniflare | undefined;

async function workerBundle(): Promise<string> {
  await build({
    configFile: false,
    root,
    logLevel: "error",
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
    build: {
      ssr: path.join(root, "scripts/company-pdf-worker-entry.ts"),
      outDir,
      emptyOutDir: true,
      minify: true,
      sourcemap: false,
      target: "es2022",
      rollupOptions: {
        output: {
          format: "es",
          entryFileNames: "worker.js",
          inlineDynamicImports: true,
        },
      },
    },
    ssr: {
      target: "webworker",
      noExternal: true,
    },
  });
  return path.join(outDir, "worker.js");
}

describe("company PDF workerd bundle", () => {
  afterAll(async () => {
    await miniflare?.dispose();
  });

  it(
    "embeds fonts for teaser and dossier after minify",
    async () => {
      const scriptPath = await workerBundle();
      const bundled = readFileSync(scriptPath, "utf8");
      expect(bundled).not.toMatch(/registerFontkit\(\{create:void 0\}\)/);
      miniflare = new Miniflare(
        convertV4MiniflareOptions({
          name: "company-pdf-smoke",
          modules: [
            {
              type: "ESModule",
              path: "worker.js",
              contents: bundled,
            },
          ],
          compatibilityDate: "2026-10-03",
          compatibilityFlags: ["nodejs_compat"],
        }),
      );
      const teaser = await miniflare.dispatchFetch("http://pdf/teaser");
      const teaserBody = Buffer.from(await teaser.arrayBuffer());
      expect(teaser.status, teaserBody.subarray(0, 400).toString("utf8")).toBe(200);
      expect(teaserBody.subarray(0, 5).toString()).toBe("%PDF-");
      expect(teaserBody.toString("latin1")).toMatch(/DMSans|Geist/);
      const dossier = await miniflare.dispatchFetch("http://pdf/dossier");
      const dossierBody = Buffer.from(await dossier.arrayBuffer());
      expect(dossier.status, dossierBody.subarray(0, 400).toString("utf8")).toBe(200);
      expect(dossierBody.subarray(0, 5).toString()).toBe("%PDF-");
      expect(dossierBody.toString("latin1")).toMatch(/DMSans|Geist/);
    },
    120_000,
  );
});
