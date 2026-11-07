import { bindings, defineConfig, defineWorker } from "cf/config";

/**
 * INT/Staging environment configuration for Relify.
 * 
 * This worker is ISOLATED from production:
 * - Separate worker name (releva-int)
 * - Separate database namespace (INT_DATABASE_URL)
 * - Separate auth secret (INT_BETTER_AUTH_SECRET)
 * - NO production routes or domains
 * - Sandbox/disabled payments
 * - Disabled outbound mail by default
 * - Prominent INT badge and noindex
 */
export default defineConfig({
  worker: defineWorker({
    name: "releva-int",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    // INT can run in any region (no need for Neon EU proximity)
    placement: { mode: "smart" },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // Workers AI for PDF reading (no API key needed)
      AI: bindings.ai(),
      
      // INT-specific secrets (separate from production)
      // These must be set via: wrangler secret put <NAME> --env int
      INT_DATABASE_URL: bindings.secret(),
      INT_BETTER_AUTH_SECRET: bindings.secret(),
      INT_BETTER_AUTH_URL: bindings.secret(),
      
      // Optional: test Stripe key
      INT_STRIPE_SECRET_KEY: bindings.secret(),
      
      // External API keys (optional, can be empty for INT)
      CONTEXT7_API_KEY: bindings.secret(),
      EINFORMA_API_USER: bindings.secret(),
      EINFORMA_API_KEY: bindings.secret(),
      APIEMPRESAS_API_KEY: bindings.secret(),
    },
  }),
});
