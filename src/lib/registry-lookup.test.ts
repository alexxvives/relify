import { describe, expect, it, vi } from "vitest";
import type { RegistryCompany } from "./company-registry";
import {
  createRegistryLookup,
  foundTtlMs,
  notFoundTtlMs,
  type RegistryCacheEntry,
  type RegistryLookupDeps,
  type RegistrySource,
} from "./registry-lookup";

const now = new Date("2026-10-27T10:00:00Z");

function record(overrides: Partial<RegistryCompany> = {}): RegistryCompany {
  return {
    cif: "A15075062",
    legalName: "INDITEX SA",
    address: "AVDA DIPUTACION S/N, Arteixo, A Coruña",
    region: "A Coruña",
    codename: "Proyecto Alba",
    foundedYear: 1985,
    description: "",
    principalCnae: "46.42",
    secondaryCnaes: [],
    headcount: null,
    revenueCents: null,
    ebitdaCents: null,
    adjustedEbitdaCents: null,
    statementYear: null,
    ...overrides,
  };
}

function setup(overrides: Partial<RegistryLookupDeps> = {}) {
  const cache = new Map<string, RegistryCacheEntry>();
  const deps: RegistryLookupDeps = {
    apiKey: "key",
    now: () => now,
    readCache: vi.fn((cif: string, source: RegistrySource) => Promise.resolve(cache.get(`${source}:${cif}`) ?? null)),
    writeCache: vi.fn((cif, source, found, rec) => {
      cache.set(`${source}:${cif}`, { found, record: rec, fetchedAt: now });
      return Promise.resolve();
    }),
    fetchApiEmpresas: vi.fn(() => Promise.resolve({ ok: true as const, record: record() })),
    fetchOpenMercantil: vi.fn(() => Promise.resolve({ ok: true as const, record: null })),
    warn: vi.fn(),
    ...overrides,
  };

  return { deps, cache, lookup: createRegistryLookup(deps) };
}

describe("createRegistryLookup", () => {
  it("uses APIEmpresas when a key is set and caches the result", async () => {
    const { deps, lookup } = setup();

    const first = await lookup("a-15075062");
    const second = await lookup("A15075062");

    expect(first).toEqual({ ok: true, record: record() });
    expect(second).toEqual(first);
    expect(deps.fetchApiEmpresas).toHaveBeenCalledTimes(1);
    expect(deps.fetchOpenMercantil).not.toHaveBeenCalled();
  });

  it("skips APIEmpresas entirely without a key", async () => {
    const open = record({ legalName: "FROM OPEN" });
    const { deps, lookup } = setup({
      apiKey: null,
      fetchOpenMercantil: vi.fn(() => Promise.resolve({ ok: true as const, record: open })),
    });

    expect(await lookup("A15075062")).toEqual({ ok: true, record: open });
    expect(deps.fetchApiEmpresas).not.toHaveBeenCalled();
  });

  it("falls back to OpenMercantil when the quota is exhausted", async () => {
    const open = record({ legalName: "FROM OPEN" });
    const { deps, lookup } = setup({
      fetchApiEmpresas: vi.fn(() => Promise.resolve({ ok: false as const, code: "quota" as const })),
      fetchOpenMercantil: vi.fn(() => Promise.resolve({ ok: true as const, record: open })),
    });

    expect(await lookup("A15075062")).toEqual({ ok: true, record: open });
    expect(deps.warn).toHaveBeenCalledWith("apiempresas lookup skipped: quota");
  });

  it("does not cache API errors, so the next call retries", async () => {
    const { deps, cache, lookup } = setup({
      fetchApiEmpresas: vi.fn(() => Promise.resolve({ ok: false as const, code: "rate" as const })),
    });

    await lookup("A15075062");
    await lookup("A15075062");

    expect(deps.fetchApiEmpresas).toHaveBeenCalledTimes(2);
    expect(cache.has("apiempresas:A15075062")).toBe(false);
  });

  it("fills the Free plan's missing address from OpenMercantil", async () => {
    const open = record({ address: "CALLE REAL 1, A Coruña" });
    const { lookup } = setup({
      fetchApiEmpresas: vi.fn(() => Promise.resolve({ ok: true as const, record: record({ address: "" }) })),
      fetchOpenMercantil: vi.fn(() => Promise.resolve({ ok: true as const, record: open })),
    });
    const result = await lookup("A15075062");

    expect(result.ok && result.record?.address).toBe("CALLE REAL 1, A Coruña");
    expect(result.ok && result.record?.legalName).toBe("INDITEX SA");
  });

  it("negative-caches a company APIEmpresas does not know", async () => {
    const { deps, lookup } = setup({
      fetchApiEmpresas: vi.fn(() => Promise.resolve({ ok: true as const, record: null })),
    });

    expect(await lookup("B00000000")).toEqual({ ok: true, record: null });
    await lookup("B00000000");

    expect(deps.fetchApiEmpresas).toHaveBeenCalledTimes(1);
    expect(deps.fetchOpenMercantil).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cache entry is older than its TTL", async () => {
    const { deps, cache, lookup } = setup();

    cache.set("apiempresas:A15075062", {
      found: true,
      record: record(),
      fetchedAt: new Date(now.getTime() - foundTtlMs - 1),
    });
    cache.set("apiempresas:B00000000", {
      found: false,
      record: null,
      fetchedAt: new Date(now.getTime() - notFoundTtlMs - 1),
    });

    await lookup("A15075062");
    await lookup("B00000000");

    expect(deps.fetchApiEmpresas).toHaveBeenCalledTimes(2);
  });

  it("keeps working when the cache table is unavailable", async () => {
    const { deps, lookup } = setup({
      readCache: vi.fn(() => Promise.reject(new Error("relation does not exist"))),
      writeCache: vi.fn(() => Promise.reject(new Error("relation does not exist"))),
    });

    expect(await lookup("A15075062")).toEqual({ ok: true, record: record() });
    expect(deps.warn).toHaveBeenCalledWith("registry cache write failed");
  });

  it("reports unavailable when the fallback is down and there is no key", async () => {
    const { lookup } = setup({
      apiKey: "  ",
      fetchOpenMercantil: vi.fn(() => Promise.resolve({ ok: false as const, code: "unavailable" as const })),
    });

    expect(await lookup("A15075062")).toEqual({ ok: false, code: "unavailable" });
  });
});
