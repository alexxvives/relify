import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  gaConsentDefault,
  gaConsentDenied,
  gaConsentBootstrapScript,
  gaDefaultConsentScript,
  gtmInstallScript,
  gtmNoscriptSrc,
  htmlContainsGtmContainer,
  isConversionEvent,
  parseCookieConsent,
  readGaMeasurementId,
  readGtmContainerId,
  serializeCookieConsent,
} from "./cookie-consent";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("cookie consent storage", () => {
  it("round-trips analytics on and essential-only", () => {
    expect(parseCookieConsent(serializeCookieConsent({ analytics: true }))).toEqual({ analytics: true });
    expect(parseCookieConsent(serializeCookieConsent({ analytics: false }))).toEqual({ analytics: false });
  });

  it("treats missing or junk as unset", () => {
    expect(parseCookieConsent(null)).toBeNull();
    expect(parseCookieConsent("")).toBeNull();
    expect(parseCookieConsent("{")).toBeNull();
    expect(parseCookieConsent('{"analytics":"yes"}')).toBeNull();
  });
});

describe("readGaMeasurementId", () => {
  it("accepts G- ids from NEXT_PUBLIC or the plain var, and ignores blanks and INT-empty", () => {
    expect(readGaMeasurementId({})).toBeNull();
    expect(readGaMeasurementId({ GA_MEASUREMENT_ID: "  " })).toBeNull();
    expect(readGaMeasurementId({ GA_MEASUREMENT_ID: "not-a-ga-id" })).toBeNull();
    expect(readGaMeasurementId({ GA_MEASUREMENT_ID: "G-ABC123" })).toBe("G-ABC123");
    expect(
      readGaMeasurementId({
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-PUBLIC",
        GA_MEASUREMENT_ID: "G-PLAIN",
      }),
    ).toBe("G-PUBLIC");
  });
});

describe("readGtmContainerId", () => {
  it("accepts GTM- ids and ignores a bare G- id", () => {
    expect(readGtmContainerId({})).toBeNull();
    expect(readGtmContainerId({ GTM_CONTAINER_ID: "G-ABC123" })).toBeNull();
    expect(readGtmContainerId({ GTM_CONTAINER_ID: "GTM-KMZ4Z9PZ" })).toBe("GTM-KMZ4Z9PZ");
    expect(
      readGtmContainerId({
        NEXT_PUBLIC_GTM_CONTAINER_ID: "gtm-public1",
        GTM_CONTAINER_ID: "GTM-PLAIN",
      }),
    ).toBe("GTM-PUBLIC1");
  });
});

describe("GA consent mode defaults", () => {
  it("denies analytics and ads before the banner choice", () => {
    expect(gaConsentDenied.analytics_storage).toBe("denied");
    expect(gaConsentDenied.ad_storage).toBe("denied");
    expect(gaDefaultConsentScript()).toContain("consent");
    expect(gaDefaultConsentScript()).toContain("denied");
  });

  it("emits Consent Mode v2 Advanced defaults, redaction and a stored-choice restore", () => {
    expect(gaConsentDefault.wait_for_update).toBe(500);
    expect(gaConsentDefault.functionality_storage).toBe("granted");
    expect(gaConsentDefault.security_storage).toBe("granted");
    const script = gaConsentBootstrapScript();
    expect(script).toContain("wait_for_update");
    expect(script).toContain("ads_data_redaction");
    expect(script).toContain("url_passthrough");
    expect(script).toContain("false");
    expect(script).toContain("relify.consent");
    expect(script).toContain('gtag("consent","update"');
  });
});

describe("GTM Advanced snippet", () => {
  const id = "GTM-KMZ4Z9PZ";

  it("puts gtm.js and the noscript iframe where Tag Assistant looks", () => {
    const install = gtmInstallScript(id);
    expect(install).toContain("googletagmanager.com/gtm.js?id=");
    expect(install).toContain(`'${id}'`);
    expect(gtmNoscriptSrc(id)).toBe(`https://www.googletagmanager.com/ns.html?id=${id}`);
    const html = `<!doctype html><html><head><script>${gaConsentBootstrapScript()}</script><script>${install}</script></head><body><noscript><iframe src="${gtmNoscriptSrc(id)}"></iframe></noscript></body></html>`;
    expect(htmlContainsGtmContainer(html, id)).toBe(true);
    expect(htmlContainsGtmContainer(html.replaceAll(id, "GTM-OTHER1"), id)).toBe(false);
  });
});

describe("mobile cookie sheet", () => {
  it("caps compact height and pads the body so public CTAs stay reachable", () => {
    expect(css).toMatch(/\.relify-consent-card \{[\s\S]*?max-height:\s*35vh/);
    expect(css).toMatch(/\.relify-consent-actions \{[\s\S]*?grid-template-columns:\s*1fr 1fr/);
    expect(css).toMatch(/html\.relify-consent-open body \{[\s\S]*?padding-bottom:\s*var\(--relify-consent-h/);
  });
});

describe("conversion events", () => {
  it("allowlists waitlist, valuation and sign_up names", () => {
    expect(isConversionEvent("waitlist_submit")).toBe(true);
    expect(isConversionEvent("valuation_request")).toBe(true);
    expect(isConversionEvent("sign_up")).toBe(true);
    expect(isConversionEvent("signup")).toBe(false);
    expect(isConversionEvent("email")).toBe(false);
  });
});
