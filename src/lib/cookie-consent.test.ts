import { describe, expect, it } from "vitest";
import {
  gaConsentDenied,
  gaDefaultConsentScript,
  isConversionEvent,
  parseCookieConsent,
  readGaMeasurementId,
  serializeCookieConsent,
} from "./cookie-consent";

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

describe("GA consent mode defaults", () => {
  it("denies analytics and ads before the banner choice", () => {
    expect(gaConsentDenied.analytics_storage).toBe("denied");
    expect(gaConsentDenied.ad_storage).toBe("denied");
    expect(gaDefaultConsentScript()).toContain("consent");
    expect(gaDefaultConsentScript()).toContain("denied");
  });
});

describe("conversion events", () => {
  it("allowlists waitlist, valorar and signup names", () => {
    expect(isConversionEvent("waitlist_submit")).toBe(true);
    expect(isConversionEvent("signup")).toBe(true);
    expect(isConversionEvent("email")).toBe(false);
  });
});
