import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";
import { readSiteUrl } from "@/lib/env";
import { listPublicProjects } from "@/server/listPublicProjects";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = readSiteUrl();
  let projects: Awaited<ReturnType<typeof listPublicProjects>> = [];
  try {
    projects = await listPublicProjects();
  } catch {
    // Build-time DB unavailable; skip project URLs
  }

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
      url: new URL("/proyectos", siteUrl).href,
      changeFrequency: "daily",
      priority: 0.8,
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
    ...projects.map((project) => ({
      url: new URL(`/proyectos/${project.slug}`, siteUrl).href,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
