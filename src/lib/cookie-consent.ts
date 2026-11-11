export const COOKIE_CONSENT_KEY = "relify.consent";
export const COOKIE_CONSENT_COOKIE = "relify_consent";
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export const conversionEvents = ["waitlist_submit", "valuation_request", "sign_up"] as const;
export type ConversionEvent = (typeof conversionEvents)[number];

export type CookieConsentChoice = {
  analytics: boolean;
};

export function parseCookieConsent(raw: string | null | undefined): CookieConsentChoice | null {
  if (raw === "analytics") {
    return { analytics: true };
  }
  if (raw === "essential") {
    return { analytics: false };
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const analytics = (parsed as { analytics?: unknown }).analytics;
    if (typeof analytics !== "boolean") {
      return null;
    }
    return { analytics };
  } catch {
    return null;
  }
}

export function serializeCookieConsent(choice: CookieConsentChoice): string {
  return choice.analytics ? "analytics" : "essential";
}

/** GA4 measurement ID (G-…). Fallback when no GTM container is set. Unset on INT. */
export function readGaMeasurementId(
  env: { NEXT_PUBLIC_GA_MEASUREMENT_ID?: string; GA_MEASUREMENT_ID?: string } = {
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
  },
): string | null {
  const nextPublic = env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
  const plain = env.GA_MEASUREMENT_ID?.trim() ?? "";
  const id = nextPublic.length > 0 ? nextPublic : plain;
  return /^G-[A-Z0-9]+$/i.test(id) ? id : null;
}

/** GTM container (GTM-…). Preferred over a bare G- id. Unset on INT. */
export function readGtmContainerId(
  env: { NEXT_PUBLIC_GTM_CONTAINER_ID?: string; GTM_CONTAINER_ID?: string } = {
    NEXT_PUBLIC_GTM_CONTAINER_ID: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
    GTM_CONTAINER_ID: process.env.GTM_CONTAINER_ID,
  },
): string | null {
  const nextPublic = env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() ?? "";
  const plain = env.GTM_CONTAINER_ID?.trim() ?? "";
  const id = nextPublic.length > 0 ? nextPublic : plain;
  return /^GTM-[A-Z0-9]+$/i.test(id) ? id.toUpperCase() : null;
}

export function isConversionEvent(value: string): value is ConversionEvent {
  return (conversionEvents as readonly string[]).includes(value);
}

export const gaConsentDenied = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

export const gaConsentGranted = {
  analytics_storage: "granted",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

export function gaDefaultConsentScript(): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',${JSON.stringify(gaConsentDenied)});`;
}
