import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail, senderFor } from "./mailer";

const INT_KEY = "int-maileroo-key-for-tests";
const PROD_KEY = "prod-maileroo-key-must-not-be-used";
const CATCHALL = "alex@itsrelify.com";
const ORIGINAL = "stranger@example.com";

type MailerooPayload = {
  to?: { address?: string };
  cc?: { address?: string } | Array<{ address?: string }>;
  bcc?: { address?: string } | Array<{ address?: string }>;
  reply_to?: { address?: string };
  from?: { address?: string };
  subject?: string;
  html?: string;
  plain?: string;
};

function envelopeAddresses(payload: MailerooPayload): string[] {
  const values = [payload.to, payload.cc, payload.bcc];
  const addresses: string[] = [];
  for (const value of values) {
    if (!value) {
      continue;
    }
    const list = Array.isArray(value) ? value : [value];
    for (const item of list) {
      if (item.address) {
        addresses.push(item.address.toLowerCase());
      }
    }
  }
  return addresses;
}

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

describe("sendMail INT catch-all", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INT_ENVIRONMENT;
    delete process.env.INT_EMAIL_CATCHALL;
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

  it("logs INT BLOCKED when the catch-all is missing", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await sendMail({
      to: ORIGINAL,
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
    process.env.MAILEROO_API_KEY = PROD_KEY;
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await sendMail({
      to: ORIGINAL,
      subject: "Hola",
      html: "<p>Hola</p>",
      text: "Hola",
      tag: "valuation-request-confirmation",
    });

    expect(result.status).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log.mock.calls.some((call) => String(call[0]).includes("INT BLOCKED"))).toBe(true);
  });

  it("sends only to the catch-all, never To/CC/BCC the original recipient", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    process.env.MAILEROO_API_KEY = PROD_KEY;
    const sent: { key: string | null; payload: MailerooPayload | null } = { key: null, payload: null };
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      sent.key = headers?.["x-api-key"] ?? null;
      sent.payload = JSON.parse(String(init?.body)) as MailerooPayload;
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { reference_id: "int-ref" } }),
      };
    }) as typeof fetch;

    const result = await sendMail({
      to: ORIGINAL,
      subject: "Hemos recibido tu solicitud de valoración",
      html: "<html><body><p>Hola</p></body></html>",
      text: "Hola",
      tag: "valuation-request-confirmation",
    });

    expect(result).toEqual({ status: "sent", transport: "maileroo", referenceId: "int-ref" });
    expect(sent.key).toBe(INT_KEY);
    expect(envelopeAddresses(sent.payload ?? {})).toEqual([CATCHALL]);
    expect(JSON.stringify({ to: sent.payload?.to, cc: sent.payload?.cc, bcc: sent.payload?.bcc })).not.toContain(
      ORIGINAL,
    );
    expect(sent.payload?.cc).toBeUndefined();
    expect(sent.payload?.bcc).toBeUndefined();
    expect(sent.payload?.reply_to?.address).toBe(CATCHALL);
    expect(sent.payload?.subject).toBe(`[INT → ${ORIGINAL}] Hemos recibido tu solicitud de valoración`);
    expect(sent.payload?.html).toContain(
      `Email de INT. Destinatario original: ${ORIGINAL} (usuario, valuation-request-confirmation)`,
    );
    expect(sent.payload?.plain?.startsWith("Email de INT.")).toBe(true);
  });

  it("redirects team alerts to the catch-all and never To info@", async () => {
    process.env.INT_ENVIRONMENT = "true";
    process.env.INT_MAILEROO_API_KEY = INT_KEY;
    process.env.INT_EMAIL_CATCHALL = CATCHALL;
    const sent: { payload: MailerooPayload | null } = { payload: null };
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      sent.payload = JSON.parse(String(init?.body)) as MailerooPayload;
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
    expect(envelopeAddresses(sent.payload ?? {})).toEqual([CATCHALL]);
    expect(
      JSON.stringify({ to: sent.payload?.to, cc: sent.payload?.cc, bcc: sent.payload?.bcc }),
    ).not.toContain("info@itsrelify.com");
    expect(sent.payload?.cc).toBeUndefined();
    expect(sent.payload?.bcc).toBeUndefined();
    expect(sent.payload?.reply_to?.address).toBe(CATCHALL);
    expect(sent.payload?.html).toContain(
      "Email de INT. Destinatario original: info@itsrelify.com (equipo, valuation-request)",
    );
  });
});

describe("sendMail production path", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INT_ENVIRONMENT;
    delete process.env.INT_EMAIL_CATCHALL;
    delete process.env.INT_MAILEROO_API_KEY;
    delete process.env.NOTIFY_EMAIL_WEBHOOK;
    process.env.MAILEROO_API_KEY = PROD_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("keeps the original recipient, subject, body and Reply-To", async () => {
    const sent: { key: string | null; payload: MailerooPayload | null } = { key: null, payload: null };
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      sent.key = headers?.["x-api-key"] ?? null;
      sent.payload = JSON.parse(String(init?.body)) as MailerooPayload;
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { reference_id: "prod-ref" } }),
      };
    }) as typeof fetch;

    const result = await sendMail({
      to: ORIGINAL,
      subject: "Hemos recibido tu solicitud de valoración",
      html: "<html><body><p>Hola</p></body></html>",
      text: "Hola",
      tag: "valuation-request-confirmation",
    });

    expect(result).toEqual({ status: "sent", transport: "maileroo", referenceId: "prod-ref" });
    expect(sent.key).toBe(PROD_KEY);
    expect(envelopeAddresses(sent.payload ?? {})).toEqual([ORIGINAL]);
    expect(sent.payload?.subject).toBe("Hemos recibido tu solicitud de valoración");
    expect(sent.payload?.html).not.toContain("Email de INT.");
    expect(sent.payload?.plain).toBe("Hola");
    expect(sent.payload?.reply_to?.address).toBe("info@itsrelify.com");
  });
});
