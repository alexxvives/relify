import { headers } from "next/headers";

import { readSiteUrl } from "@/lib/env";

const TRUSTED_HOSTS = new Set([
  "itsrelify.com",
  "www.itsrelify.com",
  "releva.alexxvives.workers.dev",
  "localhost:3000",
]);

export function isTrustedHost(host: string, configuredHost: string): boolean {
  return host === configuredHost || TRUSTED_HOSTS.has(host);
}

// Return URLs (Stripe success/cancel, billing portal) must land on the same host the
// user is browsing; otherwise the session cookie is missing there and they look logged out.
export async function requestOrigin(): Promise<string> {
  const configured = readSiteUrl();
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");

  if (host === null || !isTrustedHost(host, configured.host)) {
    return configured.origin;
  }

  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
