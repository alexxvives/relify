const HEALTH_TIMEOUT_MS = 1500;

export type HealthStatus = { ok: true; db: "ok" } | { ok: false; db: "error" };

export async function pingDatabase(
  query: () => Promise<unknown> = async () => {
    const { prisma } = await import("./db");
    return prisma.$queryRaw`SELECT 1`;
  },
  timeoutMs = HEALTH_TIMEOUT_MS,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeoutMs);
  });
  try {
    await Promise.race([query(), timeout]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export async function readHealth(): Promise<HealthStatus> {
  const ok = await pingDatabase();
  return ok ? { ok: true, db: "ok" } : { ok: false, db: "error" };
}
