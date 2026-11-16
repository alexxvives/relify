import { bindings, defineConfig, defineWorker } from "cf/config";

/**
 * S30: production KV namespace for the vinext data cache (title `releva-vinext-cache`). Not created yet. Create it
 * once and paste its id here before the next production deploy (see docs/DEPLOY-S30.md):
 *   npx wrangler kv namespace create releva-vinext-cache
 * The placeholder is deliberate: a missing id would let the deploy auto-provision a namespace nobody tracks.
 */
const RELEVA_VINEXT_KV_CACHE_ID = "REPLACE_WITH_RELEVA_VINEXT_CACHE_NAMESPACE_ID";

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
