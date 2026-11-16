import { bindings, defineConfig, defineWorker } from "cf/config";

/**
 * S30: production KV namespace for the vinext data cache (title `releva-vinext-cache`,
 * id 1f9e6c9a4d8944d6b3bf28af2faf164f). Created 2026-11-16 in account 53808754f4bd94365d6e31351aa426c0.
 */
const RELEVA_VINEXT_KV_CACHE_ID = "1f9e6c9a4d8944d6b3bf28af2faf164f";

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
      // Workers AI reads the Modelo 200 PDFs; no API key needed.
      AI: bindings.ai(),
      // t73b: fallback transport only. Maileroo (MAILEROO_API_KEY) sends first; see src/lib/server/mailer.ts.
      EMAIL: bindings.sendEmail({
        allowedSenderAddresses: ["notificaciones@itsrelify.com", "info@itsrelify.com"],
      }),
      DATABASE_URL: bindings.secret(),
      BETTER_AUTH_SECRET: bindings.secret(),
      BETTER_AUTH_URL: bindings.secret(),
      // Maileroo sending key for itsrelify.com (wrangler secret put MAILEROO_API_KEY).
      MAILEROO_API_KEY: bindings.secret(),
      // vinext data cache (kvDataAdapter in vite.config.ts reads this binding name).
      VINEXT_KV_CACHE: bindings.kv({ id: RELEVA_VINEXT_KV_CACHE_ID }),
    },
  }),
});
