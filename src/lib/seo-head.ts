import type { Metadata } from "next";

/**
 * Child `metadata.title` uses the template: "Vender tu empresa | Relify" (S32, so search results name the brand).
 * INT document titles match the INT badge: `[INT] …`.
 */
export function intPrefixedTitle(isInt: boolean, defaultTitle: string): Metadata["title"] {
  if (!isInt) {
    return { default: defaultTitle, template: "%s | Relify" };
  }
  return {
    default: `[INT] ${defaultTitle}`,
    template: "[INT] %s | Relify",
  };
}

/** Pages that set an absolute title (the home `/` page) still get the INT prefix. */
export function intAbsoluteTitle(isInt: boolean, title: string): Metadata["title"] {
  return { absolute: isInt ? `[INT] ${title}` : title };
}

export const OG_IMAGE_PATH = "/og.jpg";
export const OG_IMAGE_ALT = "Relify — plataforma para comprar y vender pymes";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function ogImageUrl(origin: URL): string {
  return new URL(OG_IMAGE_PATH, origin).href;
}

/** S32: one icon set, rendered from the R of the wordmark (favicon.ico holds 16, 32, 48 and 256). */
export function rootIcons(): {
  icon: Array<{ url: string; sizes?: string; type?: string }>;
  apple: Array<{ url: string; sizes?: string }>;
} {
  return {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  };
}

/** Square logo Google can use for the Organization (at least 112 px, on white). */
export const ORGANIZATION_LOGO_PATH = "/brand/logo-512.png";

/** Organization + WebSite structured data for the home page, so search results show the Relify name and logo. */
export function siteJsonLd(origin: URL, description: string) {
  const url = new URL("/", origin).href;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: "Relify",
        url,
        logo: { "@type": "ImageObject", url: new URL(ORGANIZATION_LOGO_PATH, origin).href, width: 512, height: 512 },
        description,
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: "Relify",
        alternateName: "Relify, compraventa de empresas",
        url,
        description,
        inLanguage: "es",
        publisher: { "@id": `${url}#organization` },
      },
    ],
  };
}

export function pageSocialMetadata(input: {
  title: string;
  description: string;
  path: string;
  origin: URL;
}): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  const url = new URL(input.path, input.origin).href;
  const image = ogImageUrl(input.origin);
  return {
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      locale: "es_ES",
      type: "website",
      siteName: "Relify",
      images: [
        {
          url: image,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

/** True only when rel=icon and og:image sit in the document <head>, not in a streamed <body>. */
export function headContainsIconAndOgImage(html: string): boolean {
  const start = html.search(/<head[\s>]/i);
  const end = html.search(/<\/head>/i);
  if (start < 0 || end < 0 || end <= start) {
    return false;
  }
  const head = html.slice(start, end);
  return /rel=["']icon["']/i.test(head) && /property=["']og:image["']/i.test(head);
}
