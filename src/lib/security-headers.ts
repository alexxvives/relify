export type HeaderPair = { key: string; value: string };

/**
 * Applied to every Next response. frame-ancestors and X-Frame-Options both deny framing.
 * script-src keeps unsafe-inline/eval because Next hydration still emits inline scripts.
 */
export const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com",
  "font-src 'self' data:",
  // S25: Ubicación autocomplete (OpenStreetMap: Photon first, Nominatim fallback). Keyless, free, read-only.
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://photon.komoot.io https://nominatim.openstreetmap.org",
  "frame-src 'self' https://www.googletagmanager.com",
  "upgrade-insecure-requests",
].join("; ");

export const securityHeaders: HeaderPair[] = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];
