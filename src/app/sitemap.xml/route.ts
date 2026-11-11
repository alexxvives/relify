import { blogPosts } from "@/lib/blog";
import { readSiteUrl } from "@/lib/env";
import { isIntEnvironment } from "@/lib/int-env";
import { siteMapUrls, sitemapXml } from "@/lib/site-index";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(sitemapXml(siteMapUrls(readSiteUrl(), blogPosts, isIntEnvironment())), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
