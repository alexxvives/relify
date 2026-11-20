import { afterEach, describe, expect, it, vi } from "vitest";
import { advisorCopy } from "@/lib/advisor-copy";
import { engagementCopy } from "@/lib/engagement-copy";
import { htmlToText, isBlockedAddress, parsePublicSiteUrl, tidyDescription } from "@/lib/site-url";

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/server/email-throttle", () => ({ takeThrottle: vi.fn(async () => true) }));

describe("S33 site URL guard", () => {
  it("accepts public http(s) sites and adds https", () => {
    expect(parsePublicSiteUrl("miempresa.es")?.toString()).toBe("https://miempresa.es/");
    expect(parsePublicSiteUrl("http://www.miempresa.es/quienes-somos#x")?.toString()).toBe("http://www.miempresa.es/quienes-somos");
  });

  it.each([
    "",
    "ftp://miempresa.es",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "https://user:pass@miempresa.es",
    "https://miempresa.es:8080",
    "http://localhost",
    "http://127.0.0.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://0x7f.1",
    "http://2130706433",
    "http://intranet",
    "http://router.local",
    "http://metadata.google.internal",
    "mi empresa.es",
  ])("rejects %s", (value) => {
    expect(parsePublicSiteUrl(value)).toBeNull();
  });

  it.each(["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.5.4", "192.168.1.1", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "64:ff9b::a00:1", "nonsense"])(
    "blocks address %s",
    (ip) => {
      expect(isBlockedAddress(ip)).toBe(true);
    },
  );

  it.each(["93.184.216.34", "2606:4700::6810:84e5", "172.32.0.1"])("allows public address %s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });
});

describe("S33 text extraction", () => {
  it("keeps title, meta description and visible text, drops scripts and styles", () => {
    const text = htmlToText(
      '<html><head><title>Ferretería Delta</title><meta name="description" content="Suministro industrial"><style>p{}</style></head><body><script>alert(1)</script><p>Dos tiendas &amp; reparto</p></body></html>',
    );
    expect(text).toContain("Ferretería Delta");
    expect(text).toContain("Suministro industrial");
    expect(text).toContain("Dos tiendas & reparto");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("p{}");
  });

  it("cuts the model output at a sentence within 1000 characters", () => {
    const long = `Descripción: ${"La empresa vende herramientas. ".repeat(60)}`;
    const tidy = tidyDescription(long);
    expect(tidy.length).toBeLessThanOrEqual(1000);
    expect(tidy.endsWith(".")).toBe(true);
    expect(tidy.startsWith("La empresa")).toBe(true);
  });
});

describe("S33 fetchPublicSiteText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function dns(ip: string) {
    return new Response(JSON.stringify({ Answer: [{ type: ip.includes(":") ? 28 : 1, data: ip }] }), { status: 200 });
  }

  it("refuses a hostname that resolves to a private address", async () => {
    const fetchMock = vi.fn(async (input: string) => (String(input).includes("dns-query") ? dns("10.0.0.5") : new Response("nope")));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchPublicSiteText } = await import("@/lib/server/describe-from-website");
    const result = await fetchPublicSiteText("miempresa.es");
    expect(result.ok).toBe(false);
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes("dns-query"))).toBe(true);
  });

  it("re-checks redirects and refuses one to localhost", async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (String(input).includes("dns-query")) return dns("93.184.216.34");
      return new Response(null, { status: 302, headers: { location: "http://localhost/admin" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchPublicSiteText } = await import("@/lib/server/describe-from-website");
    const result = await fetchPublicSiteText("miempresa.es");
    expect(result).toEqual({ ok: false, message: "Esa dirección no es una web pública." });
  });

  it("reads a public HTML page", async () => {
    const html = `<html><head><title>Imprenta Duero</title></head><body><p>${"Impresión de etiquetas para la industria alimentaria. ".repeat(5)}</p></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => (String(input).includes("dns-query") ? dns("93.184.216.34") : new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))),
    );
    const { fetchPublicSiteText } = await import("@/lib/server/describe-from-website");
    const result = await fetchPublicSiteText("imprentaduero.es");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.text).toContain("Imprenta Duero");
  });

  it("reports the AI as unavailable outside Workers (no binding), without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { describeFromWebsite } = await import("@/lib/server/describe-from-website");
    const result = await describeFromWebsite("user-1", "miempresa.es");
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("S33 copy", () => {
  it("merges the marketplace section and recommends the RC insurance", () => {
    expect(advisorCopy.servicesPanelTitle).toBe("Tu perfil en el marketplace");
    expect(advisorCopy.documentsInsurance).toMatch(/seguro de responsabilidad civil/);
    expect(engagementCopy.figuresSellerShared).not.toMatch(/NDA/);
  });
});
