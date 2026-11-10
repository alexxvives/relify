import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail, senderFor } from "./mailer";

describe("senderFor", () => {
  it("sends a team alert from the inbox to itself", () => {
    expect(senderFor("info@itsrelify.com")).toEqual({
      address: "info@itsrelify.com",
      name: "Relify",
    });
    expect(senderFor(" Info@ItsRelify.com ")).toEqual({
      address: "info@itsrelify.com",
      name: "Relify",
    });
  });

  it("keeps mail to a person on notificaciones@", () => {
    expect(senderFor("alexxvives@gmail.com")).toEqual({
      address: "notificaciones@itsrelify.com",
      name: "Relify",
    });
  });
});

describe("sendMail INT allowlist", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;
  const INT_KEY = "int-maileroo-key-for-tests";

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INT_ENVIRONMENT;
    delete process.env.INT_EMAIL_ALLOWLIST;
    delete process.env.INT_MAILEROO_API_KEY;
    delete process.env.MAILEROO_API_KEY;
    delete process.env.NOTIFY_EMAIL_WEBHOOK;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("logs INT BLOCKED when the recipient is not allowlisted", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await sendMail({
      to: "stranger@example.com",
      subject: "Hola",
      html: "<p>Hola</p>",
      text: "Hola",
      tag: "valuation-request-confirmation",
    });

    expect(result.status).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log.mock.calls.some((call) => String(call[0]).includes("INT BLOCKED"))).toBe(true);
  });

  it("does not send with the production Maileroo key on INT", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.MAILEROO_API_KEY = "prod-maileroo-key-must-not-be-used";
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await sendMail({
      to: "alex@itsrelify.com",
      subject: "Hola",
      html: "<p>Hola</p>",
      text: "Hola",
      tag: "valuation-request-confirmation",
    });

    expect(result.status).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log.mock.calls.some((call) => String(call[0]).includes("INT BLOCKED"))).toBe(true);
  });

  it("sends only to an allowlisted address with the INT key and prefixes the subject", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    process.env.MAILEROO_API_KEY = "prod-maileroo-key-must-not-be-used";
    const sent: { key: string | null; payload: { subject: string; to: { address: string } } | null } = {
      key: null,
      payload: null,
    };
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      sent.key = headers?.["x-api-key"] ?? null;
      sent.payload = JSON.parse(String(init?.body)) as { subject: string; to: { address: string } };
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { reference_id: "int-ref" } }),
      };
    }) as typeof fetch;

    const result = await sendMail({
      to: "alex@itsrelify.com",
      subject: "Hemos recibido tu solicitud de valoración",
      html: "<p>Hola</p>",
      text: "Hola",
      tag: "valuation-request-confirmation",
    });

    expect(result).toEqual({ status: "sent", transport: "maileroo", referenceId: "int-ref" });
    expect(sent.key).toBe(INT_KEY);
    expect(sent.payload?.subject).toBe("[INT] Hemos recibido tu solicitud de valoración");
    expect(sent.payload?.to).toEqual({ address: "alex@itsrelify.com" });
  });

  it("redirects info@ alerts to the first allowlisted address, never to info@", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_ALLOWLIST = "alex@itsrelify.com";
    const sent: { payload: { to: { address: string }; from: { address: string } } | null } = { payload: null };
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      sent.payload = JSON.parse(String(init?.body)) as { to: { address: string }; from: { address: string } };
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { reference_id: "int-ref" } }),
      };
    }) as typeof fetch;

    const result = await sendMail({
      to: "info@itsrelify.com",
      subject: "Valoración solicitada",
      html: "<p>Alerta</p>",
      text: "Alerta",
      tag: "valuation-request",
    });

    expect(result.status).toBe("sent");
    expect(sent.payload?.to.address).toBe("alex@itsrelify.com");
    expect(sent.payload?.to.address).not.toBe("info@itsrelify.com");
    expect(sent.payload?.from.address).toBe("notificaciones@itsrelify.com");
  });
});
