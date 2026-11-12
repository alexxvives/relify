import { afterEach, describe, expect, it, vi } from "vitest";

import { emailLink, emailSiteUrl, readSiteUrl } from "@/lib/env";
import { welcomeEmail } from "@/lib/email/messages";

describe("email links (t85-15)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("use itsrelify.com even when BETTER_AUTH_URL still holds the old workers.dev origin", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://releva.alexxvives.workers.dev");
    vi.stubEnv("PUBLIC_SITE_URL", "");
    expect(emailSiteUrl().origin).toBe("https://itsrelify.com");
    expect(readSiteUrl().origin).toBe("https://itsrelify.com");
    expect(emailLink("/mi-empresa")).toBe("https://itsrelify.com/mi-empresa");
  });

  it("keeps sitemap and canonical on itsrelify.com when BETTER_AUTH_URL is workers.dev", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://releva.alexxvives.workers.dev");
    vi.stubEnv("PUBLIC_SITE_URL", "");
    expect(readSiteUrl().href).toBe("https://itsrelify.com/");
    expect(new URL("/sitemap.xml", readSiteUrl()).href).toBe("https://itsrelify.com/sitemap.xml");
  });

  it("move a full Better Auth link onto the canonical origin, keeping path and token", () => {
    expect(emailLink("https://releva.alexxvives.workers.dev/api/auth/verify-email?token=abc&callbackURL=%2F")).toBe(
      "https://itsrelify.com/api/auth/verify-email?token=abc&callbackURL=%2F",
    );
  });

  it("honour an https PUBLIC_SITE_URL override and ignore non-https ones", () => {
    vi.stubEnv("PUBLIC_SITE_URL", "https://www.itsrelify.com/x");
    expect(emailLink("/a")).toBe("https://www.itsrelify.com/a");
    vi.stubEnv("PUBLIC_SITE_URL", "http://evil.test");
    expect(emailLink("/a")).toBe("https://itsrelify.com/a");
  });

  it("INT public origin is the INT host, not itsrelify.com", () => {
    vi.stubEnv("INT_ENVIRONMENT", "true");
    vi.stubEnv("INT_BETTER_AUTH_URL", "https://releva-int.account.workers.dev");
    expect(readSiteUrl().origin).toBe("https://releva-int.account.workers.dev");
  });

  it("welcome email CTA points at itsrelify.com", () => {
    const mail = welcomeEmail("seller", "Ana", emailSiteUrl());
    expect(mail.html).toContain("https://itsrelify.com/");
    expect(mail.html).not.toContain("workers.dev");
  });
});
