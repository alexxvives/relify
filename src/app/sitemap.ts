import type { MetadataRoute } from "next";
import { readSiteUrl } from "@/lib/env";
import { listPublicProjects } from "@/server/listPublicProjects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = readSiteUrl();
  const projects = await listPublicProjects();

  return [
    {
      url: new URL("/", siteUrl).href,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/proyectos", siteUrl).href,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...projects.map((project) => ({
      url: new URL(`/proyectos/${project.slug}`, siteUrl).href,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
