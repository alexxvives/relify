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

/**
 * Canonical public origin for emails, sitemap, robots, canonical, and Open Graph.
 * Never the request host and never BETTER_AUTH_URL (that secret still holds the old
 * workers.dev origin for cookies). Prod is PUBLIC_SITE_URL (https) or itsrelify.com;
 * INT uses the INT auth origin.
 */
export const CANONICAL_SITE_URL = "https://itsrelify.com";

export function emailSiteUrl(): URL {
  return new URL(getSiteOrigin());
}

export function readSiteUrl(): URL {
  return emailSiteUrl();
}

/** Link on the canonical email domain: a path, or a full URL (e.g. Better Auth's verify link) moved onto that origin. */
export function emailLink(pathOrUrl: string): string {
  const site = emailSiteUrl();
  const url = new URL(pathOrUrl, site);
  url.protocol = site.protocol;
  url.host = site.host;
  return url.toString();
}
