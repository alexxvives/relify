import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchApiEmpresas } from "./fetchApiEmpresas";

const company = {
  success: true,
  data: {
    cif: "A15075062",
    name: "INDITEX SA",
    cnae: "4642",
    province: "A CORUÑA",
    status_code: "ACTIVE",
  },
};

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
  vi.stubGlobal("fetch", fn);

  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchApiEmpresas", () => {
  it("sends the key in X-API-KEY and maps a hit", async () => {
    const fn = mockFetch(200, company);
    const result = await fetchApiEmpresas("a-15075062", "secret");

    expect(result.ok && result.record?.legalName).toBe("INDITEX SA");
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe("https://apiempresas.es/api/v1/companies?cif=A15075062");
    expect((init.headers as Record<string, string>)["X-API-KEY"]).toBe(
      "secret",
    );
  });

  it("returns null for 404 COMPANY_NOT_FOUND", async () => {
    mockFetch(404, { success: false, error: "COMPANY_NOT_FOUND" });

    expect(await fetchApiEmpresas("B00000000", "k")).toEqual({
      ok: true,
      record: null,
    });
  });

  it("distinguishes quota from rate limiting", async () => {
    mockFetch(429, { success: false, code: "QUOTA_EXCEEDED" });
    expect(await fetchApiEmpresas("A15075062", "k")).toEqual({
      ok: false,
      code: "quota",
    });

    mockFetch(429, { success: false, code: "TOO_MANY_REQUESTS" });
    expect(await fetchApiEmpresas("A15075062", "k")).toEqual({
      ok: false,
      code: "rate",
    });
  });

  it("maps bad keys to auth and server trouble to unavailable", async () => {
    mockFetch(401, { success: false, code: "API_KEY_INVALID" });
    expect(await fetchApiEmpresas("A15075062", "k")).toEqual({
      ok: false,
      code: "auth",
    });

    mockFetch(500, {});
    expect(await fetchApiEmpresas("A15075062", "k")).toEqual({
      ok: false,
      code: "unavailable",
    });
  });

  it("is unavailable on a network error or a malformed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("boom"))),
    );
    expect(await fetchApiEmpresas("A15075062", "k")).toEqual({
      ok: false,
      code: "unavailable",
    });

    mockFetch(200, { hello: "world" });
    expect(await fetchApiEmpresas("A15075062", "k")).toEqual({
      ok: false,
      code: "unavailable",
    });
  });
});
