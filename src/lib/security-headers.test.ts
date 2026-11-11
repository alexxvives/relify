import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

describe("securityHeaders", () => {
  it("denies framing, sets nosniff, HSTS and a CSP with frame-ancestors none", () => {
    const map = Object.fromEntries(securityHeaders.map((header) => [header.key, header.value]));
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["Strict-Transport-Security"]).toContain("max-age=");
    expect(map["Content-Security-Policy"]).toBe(contentSecurityPolicy);
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("form-action 'self'");
    expect(contentSecurityPolicy).toContain("https://www.googletagmanager.com");
    expect(contentSecurityPolicy).toContain("https://www.google-analytics.com");
    expect(contentSecurityPolicy).toContain("frame-src 'self' https://www.googletagmanager.com");
  });
});
