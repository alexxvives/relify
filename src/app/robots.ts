import type { MetadataRoute } from "next";
import { readSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = readSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/archivo", "/proyectos", "/entrar", "/registro", "/onboarding"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
