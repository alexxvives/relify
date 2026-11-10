import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { shouldBlockEmail } from "../server/int-guards";
import {
  decideIntMail,
  emailMatchesAllowlist,
  firstAllowlistedAddress,
  intMailConfigured,
  intMailerooKey,
  parseIntEmailAllowlist,
  prefixIntSubject,
} from "./int-mail";

const INT_KEY = "int-maileroo-key-for-tests";

describe("INT email allowlist", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INT_ENVIRONMENT;
    delete process.env.INT_EMAIL_ALLOWLIST;
    delete process.env.INT_MAILEROO_API_KEY;
    delete process.env.MAILEROO_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses exact addresses and @domain entries", () => {
    expect(parseIntEmailAllowlist(" alex@itsrelify.com , @example.com ")).toEqual([
      "alex@itsrelify.com",
      "@example.com",
    ]);
    expect(parseIntEmailAllowlist("")).toEqual([]);
    expect(parseIntEmailAllowlist(undefined)).toEqual([]);
  });

  it("matches an exact address or a domain suffix, not a lookalike host", () => {
    const allowlist = ["alex@itsrelify.com", "@relify.test"];
    expect(emailMatchesAllowlist("alex@itsrelify.com", allowlist)).toBe(true);
    expect(emailMatchesAllowlist("Alex@ItsRelify.com", allowlist)).toBe(true);
    expect(emailMatchesAllowlist("ops@relify.test", allowlist)).toBe(true);
    expect(emailMatchesAllowlist("ops@notrelify.test", allowlist)).toBe(false);
    expect(emailMatchesAllowlist("other@itsrelify.com", allowlist)).toBe(false);
  });

  it("never treats the production Maileroo key as the INT key", () => {
    process.env.MAILEROO_API_KEY = "prod-maileroo-key-must-not-be-used";
    expect(intMailerooKey()).toBeNull();
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    expect(intMailerooKey()).toBe(INT_KEY);
  });

  it("is unconfigured without both the INT key and a non-empty allowlist", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    expect(intMailConfigured()).toBe(false);
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    expect(intMailConfigured()).toBe(true);
  });

  it("allows an exact allowlisted recipient when the INT key is present", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com,@relify.test";
    expect(decideIntMail("alex@itsrelify.com")).toEqual({ send: true, to: "alex@itsrelify.com" });
    expect(decideIntMail("qa@relify.test")).toEqual({ send: true, to: "qa@relify.test" });
  });

  it("denies a recipient outside the allowlist even with the INT key", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    expect(decideIntMail("stranger@example.com")).toEqual({
      send: false,
      to: "stranger@example.com",
      reason: "recipient not allowlisted",
    });
  });

  it("denies when the INT key is missing, including if the prod key is set", () => {
    process.env.MAILEROO_API_KEY = "prod-maileroo-key-must-not-be-used";
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    expect(decideIntMail("alex@itsrelify.com")).toEqual({
      send: false,
      to: "alex@itsrelify.com",
      reason: "missing INT_MAILEROO_API_KEY",
    });
  });

  it("redirects info@ to the first exact allowlisted address and never keeps info@", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "@itsrelify.com,alex@itsrelify.com";
    expect(firstAllowlistedAddress(parseIntEmailAllowlist(process.env.INT_EMAIL_ALLOWLIST))).toBe(
      "alex@itsrelify.com",
    );
    expect(decideIntMail("info@itsrelify.com")).toEqual({ send: true, to: "alex@itsrelify.com" });
    expect(decideIntMail("INFO@itsrelify.com")).toEqual({ send: true, to: "alex@itsrelify.com" });
  });

  it("blocks team alerts when the allowlist has no exact address to redirect to", () => {
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "@itsrelify.com";
    expect(decideIntMail("info@itsrelify.com")).toEqual({
      send: false,
      to: "info@itsrelify.com",
      reason: "no allowlisted address for team inbox",
    });
  });

  it("prefixes INT subjects once", () => {
    expect(prefixIntSubject("Valoración solicitada")).toBe("[INT] Valoración solicitada");
    expect(prefixIntSubject("[INT] Ya")).toBe("[INT] Ya");
  });

  it("keeps shouldBlockEmail true on INT until the INT key and allowlist are both set", () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_EMAIL_ENABLED = "true";
    expect(shouldBlockEmail()).toBe(true);
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    expect(shouldBlockEmail()).toBe(false);
  });
});
