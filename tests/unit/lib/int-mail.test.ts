import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { shouldBlockEmail } from "@/lib/server/int-guards";
import {
  applyIntCatchallBody,
  decideIntMail,
  intEmailCatchall,
  intMailBanner,
  intMailConfigured,
  intMailerooKey,
  intRecipientRole,
  prefixIntSubject,
} from "@/lib/int-mail";

const INT_KEY = "int-maileroo-key-for-tests";
const CATCHALL = "alex@itsrelify.com";

describe("INT email catch-all", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INT_ENVIRONMENT;
    delete process.env.INT_EMAIL_CATCHALL;
    delete process.env.INT_EMAIL_ALLOWLIST;
    delete process.env.INT_MAILEROO_API_KEY;
    delete process.env.MAILEROO_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("never treats the production Maileroo key as the INT key", () => {
    process.env.MAILEROO_API_KEY = "prod-maileroo-key-must-not-be-used";
    expect(intMailerooKey()).toBeNull();
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    expect(intMailerooKey()).toBe(INT_KEY);
  });

  it("accepts one catch-all address and rejects lists or blanks", () => {
    process.env.INT_EMAIL_CATCHALL = ` ${CATCHALL} `;
    expect(intEmailCatchall()).toBe(CATCHALL);
    process.env.INT_EMAIL_CATCHALL = `${CATCHALL},other@example.com`;
    expect(intEmailCatchall()).toBeNull();
    process.env.INT_EMAIL_CATCHALL = "";
    expect(intEmailCatchall()).toBeNull();
  });

  it("is unconfigured without both the INT key and the catch-all", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    expect(intMailConfigured()).toBe(false);
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    expect(intMailConfigured()).toBe(true);
  });

  it("rewrites every recipient, including info@ and a visitor, to the catch-all", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    expect(decideIntMail("stranger@example.com")).toEqual({
      send: true,
      to: CATCHALL,
      originalTo: "stranger@example.com",
    });
    expect(decideIntMail("info@itsrelify.com")).toEqual({
      send: true,
      to: CATCHALL,
      originalTo: "info@itsrelify.com",
    });
  });

  it("blocks when the INT key is missing, including if the prod key is set", () => {
    process.env.MAILEROO_API_KEY = "prod-maileroo-key-must-not-be-used";
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    expect(decideIntMail("stranger@example.com")).toEqual({
      send: false,
      to: "stranger@example.com",
      reason: "missing INT_MAILEROO_API_KEY",
    });
  });

  it("blocks when the catch-all is missing", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    expect(decideIntMail("stranger@example.com").send).toBe(false);
  });

  it("prefixes the original recipient on the subject and labels equipo vs usuario", () => {
    expect(prefixIntSubject("Valoración solicitada", "Ana@Example.com")).toBe(
      "[INT → Ana@Example.com] Valoración solicitada",
    );
    expect(intRecipientRole("info@itsrelify.com")).toBe("equipo");
    expect(intRecipientRole("ana@example.com")).toBe("usuario");
    const banner = intMailBanner("ana@example.com", "usuario", "valuation-request-confirmation");
    expect(banner.text).toContain(
      "Email de INT. Destinatario original: ana@example.com (usuario, valuation-request-confirmation)",
    );
    expect(banner.html).toContain("ana@example.com");
  });

  it("puts the INT banner at the top of html and text", () => {
    const banner = intMailBanner("ana@example.com", "usuario", "waitlist-confirmation");
    const applied = applyIntCatchallBody(
      "<html><body><p>Hola</p></body></html>",
      "Hola",
      banner,
    );
    expect(applied.text.startsWith("Email de INT.")).toBe(true);
    expect(applied.html.indexOf("Email de INT.")).toBeLessThan(applied.html.indexOf("<p>Hola</p>"));
  });

  it("keeps shouldBlockEmail true on INT until the INT key and catch-all are both set", () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_EMAIL_ENABLED = "true";
    expect(shouldBlockEmail()).toBe(true);
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    expect(shouldBlockEmail()).toBe(false);
  });
});
