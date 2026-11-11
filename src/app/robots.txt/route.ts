import { readSiteUrl } from "@/lib/env";
import { isIntEnvironment } from "@/lib/int-env";
import { robotsTxt, siteRobots } from "@/lib/site-index";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(robotsTxt(siteRobots(readSiteUrl(), isIntEnvironment())), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
