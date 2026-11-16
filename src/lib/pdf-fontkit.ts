import type { PDFDocument } from "pdf-lib";
import * as fontkitNamespace from "@pdf-lib/fontkit";

/**
 * `@pdf-lib/fontkit` is `export default fontkit`. A namespace import has no
 * named `create`, so `{ create: fontkit.create }` becomes `{ create: void 0 }`
 * in the Workers minify. Pass the default object instead.
 */
type PdfFontkit = Parameters<PDFDocument["registerFontkit"]>[0];

function asFontkit(value: unknown): PdfFontkit | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (typeof (value as { create?: unknown }).create !== "function") {
    return null;
  }
  return value as PdfFontkit;
}

export function pdfFontkit(): PdfFontkit {
  const namespace = fontkitNamespace as unknown as { default?: unknown };
  const kit = asFontkit(namespace.default) ?? asFontkit(fontkitNamespace);
  if (!kit) {
    throw new Error("fontkit-create");
  }
  return kit;
}
