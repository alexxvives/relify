import { NextResponse } from "next/server";
import { defaultDeepHealthDeps, healthTokenMatches, runDeepHealth } from "@/lib/server/deep-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" };

/**
 * S27: deep health check. Needs `x-health-token: <HEALTHCHECK_TOKEN>`.
 * Without the secret the route answers 404, so it does not exist until it is configured.
 */
export async function GET(request: Request): Promise<Response> {
  const expected = process.env.HEALTHCHECK_TOKEN;
  if (!expected?.trim()) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  if (!healthTokenMatches(request.headers.get("x-health-token"), expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }
  const body = await runDeepHealth(await defaultDeepHealthDeps());
  return NextResponse.json(body, { status: body.ok ? 200 : 503, headers: noStore });
}
