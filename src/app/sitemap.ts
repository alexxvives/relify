import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";
import { readSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = readSiteUrl();

  return [
    {
      url: new URL("/", siteUrl).href,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/lista-de-espera", siteUrl).href,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: new URL("/valorar", siteUrl).href,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: new URL("/blog", siteUrl).href,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...blogPosts.map((post) => ({
      url: new URL(`/blog/${post.slug}`, siteUrl).href,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
