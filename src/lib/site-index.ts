import type { MetadataRoute } from "next";

export function siteRobots(siteUrl: URL, int: boolean): MetadataRoute.Robots {
  if (int) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      host: siteUrl.host,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/proyectos", "/entrar", "/registro", "/onboarding"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
    host: siteUrl.host,
  };
}

export function robotsTxt(doc: MetadataRoute.Robots): string {
  const rules = Array.isArray(doc.rules) ? doc.rules : [doc.rules];
  const lines: string[] = [];
  for (const rule of rules) {
    const agents = rule.userAgent === undefined ? ["*"] : Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];
    for (const agent of agents) {
      lines.push(`User-Agent: ${agent}`);
    }
    const allow = rule.allow === undefined ? [] : Array.isArray(rule.allow) ? rule.allow : [rule.allow];
    const disallow = rule.disallow === undefined ? [] : Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    for (const path of allow) {
      lines.push(`Allow: ${path}`);
    }
    for (const path of disallow) {
      lines.push(`Disallow: ${path}`);
    }
  }
  if (doc.host) {
    lines.push(`Host: ${doc.host}`);
  }
  const sitemaps = doc.sitemap === undefined ? [] : Array.isArray(doc.sitemap) ? doc.sitemap : [doc.sitemap];
  for (const sitemap of sitemaps) {
    lines.push(`Sitemap: ${sitemap}`);
  }
  return `${lines.join("\n")}\n`;
}

export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const changefreq = entry.changeFrequency ? `\n<changefreq>${entry.changeFrequency}</changefreq>` : "";
      const priority = entry.priority !== undefined ? `\n<priority>${entry.priority}</priority>` : "";
      const loc = entry.url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<url>\n<loc>${loc}</loc>${changefreq}${priority}\n</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function siteMapUrls(
  siteUrl: URL,
  posts: readonly { slug: string }[],
  int = false,
): MetadataRoute.Sitemap {
  if (int) {
    return [];
  }

  return [
    { url: new URL("/", siteUrl).href, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/lista-de-espera", siteUrl).href, changeFrequency: "weekly", priority: 0.7 },
    { url: new URL("/valorar", siteUrl).href, changeFrequency: "weekly", priority: 0.8 },
    { url: new URL("/cookies", siteUrl).href, changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/privacidad", siteUrl).href, changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/terminos", siteUrl).href, changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/blog", siteUrl).href, changeFrequency: "weekly", priority: 0.5 },
    ...posts.map((post) => ({
      url: new URL(`/blog/${post.slug}`, siteUrl).href,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
