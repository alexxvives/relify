import { describe, expect, it } from "vitest";
import { OG_IMAGE_PATH, headContainsIconAndOgImage, intAbsoluteTitle, intPrefixedTitle, ogImageUrl, pageSocialMetadata, rootIcons } from "./seo-head";

describe("headContainsIconAndOgImage", () => {
  it("accepts rel=icon and og:image inside <head>", () => {
    const html = `<!doctype html><html><head><link rel="icon" href="/favicon.ico"><meta property="og:image" content="https://itsrelify.com/og.jpg"></head><body></body></html>`;
    expect(headContainsIconAndOgImage(html)).toBe(true);
  });

  it("rejects the vinext streamed-into-body case", () => {
    const html = `<!doctype html><html><head><title>Relify</title></head><body><link rel="icon" href="/icon.png" data-vinext-streamed-icon="1"><meta property="og:image" content="https://itsrelify.com/og.jpg"></body></html>`;
    expect(headContainsIconAndOgImage(html)).toBe(false);
  });
});

describe("intPrefixedTitle", () => {
  it("leaves production titles unprefixed", () => {
    expect(intPrefixedTitle(false, "Detalles de empresa")).toBe("Detalles de empresa");
  });

  it("prefixes the default and every child title on INT", () => {
    expect(intPrefixedTitle(true, "Plataforma digital para comprar empresas")).toEqual({
      default: "[INT] Plataforma digital para comprar empresas",
      template: "[INT] %s",
    });
  });

  it("prefixes an absolute home title on INT so it cannot bypass the template", () => {
    expect(intAbsoluteTitle(false, "Un mercado para comprar y vender empresas")).toEqual({
      absolute: "Un mercado para comprar y vender empresas",
    });
    expect(intAbsoluteTitle(true, "Un mercado para comprar y vender empresas")).toEqual({
      absolute: "[INT] Un mercado para comprar y vender empresas",
    });
  });
});

describe("pageSocialMetadata", () => {
  it("uses summary_large_image and the 1200x630 og file", () => {
    const origin = new URL("https://itsrelify.com");
    const social = pageSocialMetadata({
      title: "Empresas",
      description: "Catálogo",
      path: "/mercado",
      origin,
    });
    expect(social.alternates).toEqual({ canonical: "https://itsrelify.com/mercado" });
    expect(social.openGraph).toMatchObject({ url: "https://itsrelify.com/mercado" });
    expect(social.twitter).toMatchObject({ card: "summary_large_image", images: [ogImageUrl(origin)] });
    const images = social.openGraph?.images;
    expect(Array.isArray(images)).toBe(true);
    const first = Array.isArray(images) ? images[0] : null;
    expect(first).toMatchObject({ url: `https://itsrelify.com${OG_IMAGE_PATH}`, width: 1200, height: 630 });
    expect(rootIcons().icon).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "/favicon.ico" }),
        expect.objectContaining({ url: "/icon.png" }),
      ]),
    );
  });
});
