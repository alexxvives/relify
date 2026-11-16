import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_KEY,
  gaConsentDenied,
  gaConsentGranted,
  parseCookieConsent,
  type ConversionEvent,
  type CookieConsentChoice,
} from "./cookie-consent";

type Gtag = (...args: unknown[]) => void;

function gtagFn(): Gtag | null {
  if (typeof window === "undefined") {
    return null;
  }
  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

function readStoredConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") {
    return null;
  }
  const fromStorage = parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
  if (fromStorage) {
    return fromStorage;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE}=([^;]*)`));
  return parseCookieConsent(match?.[1] ? decodeURIComponent(match[1]) : null);
}

export function hasAnalyticsConsent(): boolean {
  return readStoredConsent()?.analytics === true;
}

export function applyGaConsent(granted: boolean): void {
  gtagFn()?.("consent", "update", granted ? gaConsentGranted : gaConsentDenied);
}

function dataLayer(): unknown[] {
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  return w.dataLayer;
}

function ensureGtag(): Gtag | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as Window & { dataLayer?: unknown[]; gtag?: Gtag };
  w.dataLayer = w.dataLayer ?? [];
  if (typeof w.gtag !== "function") {
    w.gtag = (...args: unknown[]) => {
      w.dataLayer?.push(args);
    };
  }
  return w.gtag;
}

/** Pushes the conversion name only. Never attach email, name, CIF, or user ids. */
export function trackConversion(event: ConversionEvent): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) {
    return;
  }
  dataLayer().push({ event });
  gtagFn()?.("event", event);
}

export function loadGoogleTagManager(containerId: string): void {
  if (typeof document === "undefined" || document.getElementById("relify-gtm")) {
    return;
  }
  ensureGtag();
  dataLayer().push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "relify-gtm";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
}

export function loadGoogleAnalytics(measurementId: string): void {
  if (typeof document === "undefined" || document.getElementById("relify-ga4")) {
    return;
  }
  const gtag = ensureGtag();
  gtag?.("js", new Date());
  gtag?.("config", measurementId, { anonymize_ip: true, send_page_view: true });
  const script = document.createElement("script");
  script.id = "relify-ga4";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}
