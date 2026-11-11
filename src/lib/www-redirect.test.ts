import { describe, expect, it } from "vitest";
import { wwwRedirectTarget, wwwToApexUrl } from "./www-redirect";

describe("wwwToApexUrl", () => {
  it("redirects www to the apex and keeps path and query", () => {
    expect(wwwToApexUrl("www.itsrelify.com", "/privacidad", "?utm=1")).toBe("https://itsrelify.com/privacidad?utm=1");
    expect(wwwToApexUrl("WWW.itsrelify.com:443", "/terminos", "")).toBe("https://itsrelify.com/terminos");
  });

  it("leaves apex, INT and local hosts alone", () => {
    expect(wwwToApexUrl("itsrelify.com", "/privacidad", "")).toBeNull();
    expect(wwwToApexUrl("releva-int.account.workers.dev", "/", "")).toBeNull();
    expect(wwwToApexUrl("localhost:3000", "/", "")).toBeNull();
    expect(wwwToApexUrl(null, "/", "")).toBeNull();
  });
});

describe("wwwRedirectTarget", () => {
  it("skips the redirect on INT even when the host is www", () => {
    expect(wwwRedirectTarget(true, "www.itsrelify.com", "/cookies", "?x=1")).toBeNull();
  });

  it("redirects www in production", () => {
    expect(wwwRedirectTarget(false, "www.itsrelify.com", "/terminos", "?x=1")).toBe(
      "https://itsrelify.com/terminos?x=1",
    );
  });
});
