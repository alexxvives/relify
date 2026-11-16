import type { Metadata } from "next";

/** INT document titles match the INT badge: `[INT] …`. Child `metadata.title` uses the template. */
export function intPrefixedTitle(isInt: boolean, defaultTitle: string): Metadata["title"] {
  if (!isInt) {
    return defaultTitle;
  }
  return {
    default: `[INT] ${defaultTitle}`,
    template: "[INT] %s",
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

export function rootIcons(): {
  icon: Array<{ url: string; sizes?: string; type?: string }>;
  apple: Array<{ url: string; sizes?: string }>;
} {
  return {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
