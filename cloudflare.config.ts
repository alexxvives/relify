import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "releva",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    // Run next to Neon (AWS eu-central-1): every page makes many sequential
    // queries, so each round trip must be ~1-3 ms instead of 20-120 ms.
    placement: { region: "aws:eu-central-1" },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // Workers AI reads the Modelo 200 PDFs (src/server/financialExtraction.ts); no API key needed.
      AI: bindings.ai(),
      DATABASE_URL: bindings.secret(),
      BETTER_AUTH_SECRET: bindings.secret(),
      BETTER_AUTH_URL: bindings.secret(),
    },
  }),
});
