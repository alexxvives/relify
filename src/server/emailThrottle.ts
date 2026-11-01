import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/server/db";

/** Hash for throttle keys, so the table never stores a plain email address. */
export function throttleHash(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

/** The caller's IP as Cloudflare reports it; "unknown" outside Workers. */
export async function clientIp(): Promise<string> {
  try {
    const list = await headers();
    return (
      list.get("cf-connecting-ip") ??
      list.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

/**
 * Counts one hit on `key` in a fixed window and says whether it is still within `max`.
 * One atomic upsert, so parallel requests cannot both slip under the limit.
 * Fails open (allowed) if the database call fails: a mail limiter must not lock users out.
 */
export async function takeThrottle(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "email_throttle" ("key", "count", "window_start") VALUES (${key}, 1, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "email_throttle"."window_start" < NOW() - make_interval(secs => ${windowSeconds}::double precision) THEN 1 ELSE "email_throttle"."count" + 1 END,
        "window_start" = CASE WHEN "email_throttle"."window_start" < NOW() - make_interval(secs => ${windowSeconds}::double precision) THEN NOW() ELSE "email_throttle"."window_start" END
      RETURNING "count"`;
    return Number(rows[0]?.count ?? 1) <= max;
  } catch {
    console.warn("[throttle] counter unavailable; allowing");
    return true;
  }
}
