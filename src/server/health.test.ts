import { describe, expect, it } from "vitest";
import { pingDatabase, readHealth } from "./health";

describe("pingDatabase", () => {
  it("returns true when SELECT 1 resolves", async () => {
    await expect(pingDatabase(async () => 1, 200)).resolves.toBe(true);
  });

  it("returns false on timeout without leaking the query", async () => {
    await expect(
      pingDatabase(
        () =>
          new Promise(() => {
            /* hang */
          }),
        20,
      ),
    ).resolves.toBe(false);
  });

  it("returns false when the query throws", async () => {
    await expect(pingDatabase(() => Promise.reject(new Error("secret-connection-string")), 200)).resolves.toBe(false);
  });
});

describe("readHealth", () => {
  it("shapes a 200 payload as { ok, db: 'ok' } when the ping passes", async () => {
    const status = await pingDatabase(async () => 1, 200);
    expect(status).toBe(true);
    const payload: Awaited<ReturnType<typeof readHealth>> = status
      ? { ok: true, db: "ok" }
      : { ok: false, db: "error" };
    expect(payload).toEqual({ ok: true, db: "ok" });
  });
});
