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
 * - Outbound mail only via secrets INT_MAILEROO_API_KEY + INT_EMAIL_CATCHALL (never packaged as [vars], never the prod key)
 * - Prominent INT badge and noindex
 */
export default defineConfig({
  worker: defineWorker({
    name: "releva-int",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    observability: { enabled: true },
    // INT can run in any region (no need for Neon EU proximity)
    placement: { mode: "smart" },
    env: {
      ASSETS: bindings.assets(),
      INT_DATABASE_URL: bindings.secret(),
      INT_BETTER_AUTH_SECRET: bindings.secret(),
      INT_BETTER_AUTH_URL: bindings.secret(),
      // INT-only Maileroo key and catch-all. Worker secrets, never [vars]. See docs/INT.md.
      INT_MAILEROO_API_KEY: bindings.secret(),
      INT_EMAIL_CATCHALL: bindings.secret(),
    },
  }),
});
