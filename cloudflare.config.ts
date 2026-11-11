import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "releva",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    observability: { enabled: true },
    // Run next to Neon (AWS eu-central-1): every page makes many sequential
    // queries, so each round trip must be ~1-3 ms instead of 20-120 ms.
    placement: { region: "aws:eu-central-1" },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // Workers AI reads the Modelo 200 PDFs (src/server/financialExtraction.ts); no API key needed.
      AI: bindings.ai(),
      // t73b: fallback transport only. Maileroo (MAILEROO_API_KEY) sends first; see src/server/mailer.ts.
      EMAIL: bindings.sendEmail({
        allowedSenderAddresses: ["notificaciones@itsrelify.com", "info@itsrelify.com"],
      }),
      DATABASE_URL: bindings.secret(),
      BETTER_AUTH_SECRET: bindings.secret(),
      BETTER_AUTH_URL: bindings.secret(),
      // Maileroo sending key for itsrelify.com (wrangler secret put MAILEROO_API_KEY).
      MAILEROO_API_KEY: bindings.secret(),
    },
  }),
});
