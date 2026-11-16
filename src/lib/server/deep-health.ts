import { pingDatabase } from "./health";

/**
 * S27: deep health check behind `GET /api/health/deep`.
 * Checks the database, the API Empresas provider and the uploads bucket, each with its own status and latency.
 * The public `/api/health` stays the cheap DB ping.
 */

export type CheckStatus = "ok" | "error" | "not_configured";

export type HealthCheck = {
  status: CheckStatus;
  latencyMs: number;
  /** API Empresas only: true when the result came from the 1 h cache instead of a new paid call. */
  cached?: boolean;
  detail?: string;
};

export type DeepHealth = {
  ok: boolean;
  checkedAt: string;
  checks: { database: HealthCheck; apiEmpresas: HealthCheck; uploads: HealthCheck };
};

/** Telefónica, S.A.: a long-lived public CIF, so a lookup only fails when the provider or the key fails. */
export const healthProbeCif = "A28015865";
export const apiEmpresasCacheMs = 60 * 60 * 1000;
export const healthCheckPrefix = "health-check/";

export type HealthBucket = {
  put: (key: string, value: Uint8Array) => Promise<unknown>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>;
  delete: (key: string) => Promise<unknown>;
};

export type ProviderResult = { ok: true } | { ok: false; code: string };

export type DeepHealthDeps = {
  now: () => number;
  pingDb: () => Promise<boolean>;
  /** Empty string means no key is configured for this environment. */
  apiEmpresasKey: string;
  probeApiEmpresas: (cif: string, key: string) => Promise<ProviderResult>;
  bucket: () => Promise<HealthBucket | null>;
  randomId: () => string;
};

type CachedProvider = { at: number; check: HealthCheck };
let providerCache: CachedProvider | null = null;

export function resetDeepHealthCache(): void {
  providerCache = null;
}

async function timed<T>(now: () => number, run: () => Promise<T>): Promise<{ value: T | null; error: unknown; ms: number }> {
  const start = now();
  try {
    const value = await run();
    return { value, error: null, ms: Math.max(0, Math.round(now() - start)) };
  } catch (error) {
    return { value: null, error, ms: Math.max(0, Math.round(now() - start)) };
  }
}

export async function checkDatabase(deps: Pick<DeepHealthDeps, "now" | "pingDb">): Promise<HealthCheck> {
  const run = await timed(deps.now, deps.pingDb);
  return run.value === true ? { status: "ok", latencyMs: run.ms } : { status: "error", latencyMs: run.ms, detail: "db_unreachable" };
}

export async function checkApiEmpresas(
  deps: Pick<DeepHealthDeps, "now" | "apiEmpresasKey" | "probeApiEmpresas">,
): Promise<HealthCheck> {
  if (deps.apiEmpresasKey.trim().length === 0) {
    return { status: "not_configured", latencyMs: 0 };
  }
  const at = deps.now();
  if (providerCache && at - providerCache.at < apiEmpresasCacheMs) {
    return { ...providerCache.check, cached: true };
  }
  const run = await timed(deps.now, () => deps.probeApiEmpresas(healthProbeCif, deps.apiEmpresasKey));
  const result = run.value;
  const check: HealthCheck =
    result?.ok === true
      ? { status: "ok", latencyMs: run.ms, cached: false }
      : { status: "error", latencyMs: run.ms, cached: false, detail: result && !result.ok ? result.code : "exception" };
  // Cache failures too, so a broken key does not turn every probe into a paid call.
  providerCache = { at, check };
  return check;
}

export async function checkUploads(deps: Pick<DeepHealthDeps, "now" | "bucket" | "randomId">): Promise<HealthCheck> {
  const bucket = await deps.bucket();
  if (!bucket) {
    return { status: "not_configured", latencyMs: 0 };
  }
  const key = `${healthCheckPrefix}${deps.randomId()}`;
  const payload = new TextEncoder().encode("relify-health");
  const run = await timed(deps.now, async () => {
    await bucket.put(key, payload);
    try {
      const object = await bucket.get(key);
      if (!object) {
        return "missing";
      }
      const back = new Uint8Array(await object.arrayBuffer());
      return back.length === payload.length && back.every((byte, index) => byte === payload[index]) ? "ok" : "mismatch";
    } finally {
      await bucket.delete(key);
    }
  });
  if (run.value === "ok") {
    return { status: "ok", latencyMs: run.ms };
  }
  return { status: "error", latencyMs: run.ms, detail: run.value ?? "exception" };
}

export async function runDeepHealth(deps: DeepHealthDeps): Promise<DeepHealth> {
  const [database, apiEmpresas, uploads] = await Promise.all([checkDatabase(deps), checkApiEmpresas(deps), checkUploads(deps)]);
  const checks = { database, apiEmpresas, uploads };
  return {
    ok: Object.values(checks).every((check) => check.status !== "error"),
    checkedAt: new Date(deps.now()).toISOString(),
    checks,
  };
}

/** Constant-time compare so the token cannot be guessed byte by byte from response timing. */
export function healthTokenMatches(given: string | null, expected: string | undefined): boolean {
  const want = expected?.trim() ?? "";
  if (want.length === 0 || !given) {
    return false;
  }
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(want);
  let diff = a.length ^ b.length;
  for (let index = 0; index < b.length; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return diff === 0;
}

/** Production defaults: real DB ping, API Empresas with this environment's key, and the uploads R2 binding. */
export async function defaultDeepHealthDeps(): Promise<DeepHealthDeps> {
  const { intApiEmpresasKey, isIntEnvironment } = await import("@/lib/int-env");
  const int = isIntEnvironment();
  return {
    now: () => Date.now(),
    pingDb: () => pingDatabase(),
    apiEmpresasKey: int ? intApiEmpresasKey() : (process.env.APIEMPRESAS_API_KEY?.trim() ?? ""),
    probeApiEmpresas: async (cif, key) => {
      const { fetchApiEmpresas } = await import("./fetch-api-empresas");
      const result = await fetchApiEmpresas(cif, key);
      return result.ok ? { ok: true } : { ok: false, code: result.code };
    },
    bucket: async () => {
      try {
        const workers = await import("cloudflare:workers");
        const bound = (workers.env as Record<string, unknown>)[int ? "INT_UPLOADS" : "UPLOADS"];
        if (bound && typeof bound === "object" && "put" in bound && "get" in bound && "delete" in bound) {
          return bound as HealthBucket;
        }
      } catch {
        return null;
      }
      return null;
    },
    randomId: () => crypto.randomUUID(),
  };
}
