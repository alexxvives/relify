import { NextResponse } from "next/server";
import { readHealth } from "@/lib/server/health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET(): Promise<Response> {
  const body = await readHealth();
  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: cacheHeaders,
  });
}
