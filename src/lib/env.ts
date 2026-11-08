import * as z from "zod";
import {
  getDatabaseUrl,
  getBetterAuthSecret,
  getBetterAuthUrl,
  getSiteOrigin,
  validateIntEnvironment,
} from "./int-env";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readServerEnv(): ServerEnv {
  validateIntEnvironment();
  const DATABASE_URL = getDatabaseUrl();
  const BETTER_AUTH_SECRET = getBetterAuthSecret();
  const BETTER_AUTH_URL = getBetterAuthUrl();
  
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL,
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
  });

  if (!parsed.success) {
    console.error("[env] invalid server environment", parsed.error.issues.map((issue) => issue.path.join(".")));
    throw new Error("Invalid server environment");
  }

  return parsed.data;
}

const siteUrlSchema = z.object({
  BETTER_AUTH_URL: z.url(),
});

export function readSiteUrl(): URL {
  // Use INT-aware getter
  const BETTER_AUTH_URL = getBetterAuthUrl();
  
  const parsed = siteUrlSchema.safeParse({
    BETTER_AUTH_URL,
  });

  if (parsed.success) {
    return new URL(parsed.data.BETTER_AUTH_URL);
  }

  return new URL(CANONICAL_SITE_URL);
}

/**
 * t85-15: canonical public domain for every link we email. Emails used readSiteUrl(), i.e. the BETTER_AUTH_URL secret,
 * which on prod still holds the old workers.dev origin. That secret also drives Better Auth (cookies, callbacks), so it
 * stays as is; email links come from here instead. PUBLIC_SITE_URL overrides (https only), else itsrelify.com.
 */
export const CANONICAL_SITE_URL = "https://itsrelify.com";

export function emailSiteUrl(): URL {
  // Use INT-aware origin (never falls back to production in INT mode)
  return new URL(getSiteOrigin());
}

/** Link on the canonical email domain: a path, or a full URL (e.g. Better Auth's verify link) moved onto that origin. */
export function emailLink(pathOrUrl: string): string {
  const site = emailSiteUrl();
  const url = new URL(pathOrUrl, site);
  url.protocol = site.protocol;
  url.host = site.host;
  return url.toString();
}
