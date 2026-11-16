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

/** Consent Mode v2 Advanced defaults. wait_for_update lets a stored choice win before GTM fires. */
export const gaConsentDefault = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
  wait_for_update: 500,
} as const;

function restoreStoredConsentJs(): string {
  return `(function(){try{var s=null;try{s=JSON.parse(localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_KEY)}));}catch(e){}var m=document.cookie.match(/(?:^|; )${COOKIE_CONSENT_COOKIE}=([^;]*)/);var c=m?decodeURIComponent(m[1]):"";var on=(s&&s.analytics===true)||c==="analytics";var off=(s&&s.analytics===false)||c==="essential";if(on){gtag("consent","update",${JSON.stringify(gaConsentGranted)});}else if(off){gtag("consent","update",${JSON.stringify(gaConsentDenied)});} }catch(e){}})();`;
}

/** dataLayer + default denied + redaction, then restore a returning visitor before gtm.js. */
export function gaConsentBootstrapScript(): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',${JSON.stringify(gaConsentDefault)});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',false);${restoreStoredConsentJs()}`;
}

export function gaDefaultConsentScript(): string {
  return gaConsentBootstrapScript();
}

/** Official GTM snippet. Tag Assistant looks for googletagmanager.com/gtm.js?id=GTM-… in the raw HTML. */
export function gtmInstallScript(containerId: string): string {
  const id = containerId.toUpperCase();
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
}

export function gtmNoscriptSrc(containerId: string): string {
  return `https://www.googletagmanager.com/ns.html?id=${containerId.toUpperCase()}`;
}

/** True when Tag Assistant would see the container in the initial HTML (gtm.js in <head> and ns.html after <body>). */
export function htmlContainsGtmContainer(html: string, containerId: string): boolean {
  const id = containerId.toUpperCase();
  const headStart = html.search(/<head[\s>]/i);
  const headEnd = html.search(/<\/head>/i);
  if (headStart < 0 || headEnd <= headStart) {
    return false;
  }
  const head = html.slice(headStart, headEnd);
  const hasGtmJs = head.includes("googletagmanager.com/gtm.js");
  const hasId = head.includes(id);
  if (!hasGtmJs || !hasId) {
    return false;
  }
  const bodyStart = html.search(/<body[\s>]/i);
  if (bodyStart < 0) {
    return false;
  }
  return html.slice(bodyStart, bodyStart + 4000).includes(`googletagmanager.com/ns.html?id=${id}`);
}
