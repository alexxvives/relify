import { describe, expect, it } from "vitest";
import { robotsTxt, siteMapUrls, siteRobots, sitemapXml } from "@/lib/site-index";

const prod = new URL("https://itsrelify.com");
const intHost = new URL("https://releva-int.account.workers.dev");

describe("siteRobots", () => {
  it("points prod sitemap at itsrelify.com", () => {
    const doc = siteRobots(prod, false);
    expect(doc.host).toBe("itsrelify.com");
    expect(doc.sitemap).toBe("https://itsrelify.com/sitemap.xml");
    expect(doc.rules).toMatchObject({
      allow: "/",
      disallow: ["/proyectos", "/entrar", "/registro", "/onboarding"],
    });
  });

  it("noindexes INT and uses the INT host, not itsrelify.com", () => {
    const doc = siteRobots(intHost, true);
    expect(doc.host).toBe("releva-int.account.workers.dev");
    expect(doc.sitemap).toBeUndefined();
    expect(doc.rules).toMatchObject({ disallow: "/" });
  });
});

describe("siteMapUrls", () => {
  it("lists public URLs on the given origin", () => {
    const urls = siteMapUrls(prod, [{ slug: "nota" }]).map((entry) => entry.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://itsrelify.com/",
        "https://itsrelify.com/lista-de-espera",
        "https://itsrelify.com/valorar",
        "https://itsrelify.com/cookies",
        "https://itsrelify.com/privacidad",
        "https://itsrelify.com/terminos",
        "https://itsrelify.com/blog",
        "https://itsrelify.com/blog/nota",
      ]),
    );
    expect(urls.some((url) => url.includes("workers.dev"))).toBe(false);
  });

  it("serializes robots.txt and sitemap.xml onto itsrelify.com", () => {
    const text = robotsTxt(siteRobots(prod, false));
    expect(text).toContain("Host: itsrelify.com");
    expect(text).toContain("Sitemap: https://itsrelify.com/sitemap.xml");
    expect(text).not.toContain("workers.dev");
    expect(sitemapXml(siteMapUrls(prod, []))).toContain("<loc>https://itsrelify.com/</loc>");
  });

  it("keeps INT sitemap empty so the INT host is not advertised", () => {
    expect(siteMapUrls(intHost, [{ slug: "nota" }], true)).toEqual([]);
    expect(robotsTxt(siteRobots(intHost, true))).toContain("Disallow: /");
    expect(robotsTxt(siteRobots(intHost, true))).not.toContain("Sitemap:");
  });
});
