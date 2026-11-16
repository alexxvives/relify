import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import { brandLogoJpegBase64, brandLogoSize } from "./brand-logo-jpeg";
import { pdfFontkit } from "./pdf-fontkit";
import { dmSansRegular, dmSansSemiBold, geistRegular, geistSemiBold } from "./pdf-fonts";
import { drawLucideIcon } from "./pdf-icons";
import { projectTitle } from "./deal-documents";

const ink = rgb(18 / 255, 52 / 255, 58 / 255);
const clay = rgb(15 / 255, 110 / 255, 115 / 255);
const moss = rgb(12 / 255, 62 / 255, 68 / 255);
const teal = rgb(47 / 255, 168 / 255, 156 / 255);
const muted = rgb(92 / 255, 107 / 255, 120 / 255);
const white = rgb(1, 1, 1);
const line = rgb(221 / 255, 231 / 255, 234 / 255);
const ice = rgb(236 / 255, 247 / 255, 246 / 255);
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 36;
const CONTENT_W = PAGE_W - M * 2;

export const loiTemplateCopy = {
  title: "Carta de intenciones",
  file: "relify-carta-de-intenciones",
  kicker: "Plantilla orientativa",
  disclaimer:
    "Plantilla orientativa, revisar con asesor legal. No es un contrato de compraventa ni un compromiso de pago.",
  download: "Descargar plantilla de carta de intenciones",
} as const;

export type LoiTemplateView = {
  buyerName: string;
  codename: string;
  region: string;
  askingPrice: string;
  structure: string;
  dateLabel: string;
};

type Fonts = { sans: PDFFont; sansSemi: PDFFont; heading: PDFFont; headingSemi: PDFFont };

function pdfSafe(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").replace(/\s+/g, " ").trim();
}

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size: number, color: RGB) {
  page.drawText(pdfSafe(text), { x, y, size, font, color });
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = pdfSafe(text).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (font.widthOfTextAtSize(next, size) <= width) {
      current = next;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function card(page: PDFPage, x: number, y: number, w: number, h: number, accent: RGB = clay) {
  page.drawRectangle({ x, y, width: w, height: h, color: white, borderColor: line, borderWidth: 0.7 });
  page.drawRectangle({ x, y, width: 5, height: h, color: accent });
}

function clauses(view: LoiTemplateView): Array<{ title: string; body: string }> {
  const project = projectTitle(view.codename);
  return [
    {
      title: "Partes",
      body: `${view.buyerName} (el Comprador) manifiesta al titular de ${project}, empresa ubicada en ${view.region} (el Vendedor), su intención de estudiar la compra a través de Relify.`,
    },
    {
      title: "Precio orientativo",
      body: `La ficha indica ${view.askingPrice}. Es una referencia, no el precio cerrado. El importe definitivo se acuerda después de la revisión.`,
    },
    {
      title: "Estructura",
      body: view.structure,
    },
    {
      title: "Exclusividad",
      body: "Si el vendedor acepta esta carta, durante seis meses no negociará la venta de este proyecto con otros compradores. Si no la acepta, no hay reserva.",
    },
    {
      title: "Due diligence",
      body: "Tras la aceptación, el comprador puede revisar la documentación compartida en Relify, con un asesor si lo contrata, antes de un contrato de compraventa.",
    },
    {
      title: "Confidencialidad",
      body: "Sigue vigente el NDA firmado en Relify. Esta carta no entrega la razón social, el CIF ni el domicilio.",
    },
    {
      title: "No vinculante",
      body: "Esta carta no obliga a comprar ni a vender. No es el contrato ni el pago. La firma deja constancia de la oferta indicativa.",
    },
    {
      title: "Honorarios Relify",
      body: "Si la operación se firma, el vendedor abona a Relify un 5 % del precio de compraventa en el momento de la firma, según las condiciones de la plataforma. La firma y el depósito se canalizan a través de Relify.",
    },
  ];
}

export function loiTemplateFileName(codename: string): string {
  const slug = pdfSafe(codename)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${loiTemplateCopy.file}-${slug || "proyecto"}.pdf`;
}

export async function buildLoiTemplatePdf(view: LoiTemplateView): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(pdfFontkit());
  const fonts: Fonts = {
    sans: await doc.embedFont(dmSansRegular, { subset: true }),
    sansSemi: await doc.embedFont(dmSansSemiBold, { subset: true }),
    heading: await doc.embedFont(geistRegular, { subset: true }),
    headingSemi: await doc.embedFont(geistSemiBold, { subset: true }),
  };
  const logo = await doc.embedJpg(Buffer.from(brandLogoJpegBase64, "base64"));
  const page = doc.addPage([PAGE_W, PAGE_H]);
  drawLetterhead(page, fonts, logo);
  page.drawRectangle({ x: 0, y: PAGE_H - 148, width: PAGE_W, height: 96, color: moss });
  page.drawRectangle({ x: 0, y: PAGE_H - 148, width: 8, height: 96, color: clay });
  drawText(page, fonts.sansSemi, loiTemplateCopy.kicker.toUpperCase(), M, PAGE_H - 78, 9, teal);
  drawText(page, fonts.headingSemi, loiTemplateCopy.title, M, PAGE_H - 106, 22, white);
  drawText(page, fonts.sans, projectTitle(view.codename), M, PAGE_H - 128, 11, rgb(0.78, 0.9, 0.88));

  const facts: Array<{ icon: "users" | "banknote" | "shieldCheck"; label: string; value: string }> = [
    { icon: "users", label: "Comprador", value: view.buyerName },
    { icon: "banknote", label: "Precio pedido", value: view.askingPrice },
    { icon: "shieldCheck", label: "Fecha", value: view.dateLabel },
  ];
  const boxW = (CONTENT_W - 16) / 3;
  facts.forEach((fact, index) => {
    const x = M + index * (boxW + 8);
    const y = PAGE_H - 220;
    card(page, x, y, boxW, 56, clay);
    drawLucideIcon(page, fact.icon, x + boxW - 26, y + 34, 13, clay);
    drawText(page, fonts.sans, fact.label.toUpperCase(), x + 14, y + 38, 7, muted);
    const lines = wrap(fonts.sansSemi, fact.value, 10, boxW - 36).slice(0, 2);
    let ty = y + 20;
    for (const line of lines) {
      drawText(page, fonts.sansSemi, line, x + 14, ty, 10, ink);
      ty -= 12;
    }
  });

  let y = PAGE_H - 248;
  page.drawRectangle({ x: M, y: y - 36, width: CONTENT_W, height: 40, color: ice, borderColor: line, borderWidth: 0.6 });
  let noteY = y - 14;
  for (const line of wrap(fonts.sans, loiTemplateCopy.disclaimer, 8, CONTENT_W - 24).slice(0, 2)) {
    drawText(page, fonts.sans, line, M + 12, noteY, 8, moss);
    noteY -= 11;
  }
  y -= 56;

  for (const clause of clauses(view)) {
    const lines = wrap(fonts.sans, clause.body, 9, CONTENT_W - 28);
    const height = 28 + lines.length * 12;
    if (y - height < 48) {
      break;
    }
    card(page, M, y - height, CONTENT_W, height, teal);
    drawText(page, fonts.headingSemi, clause.title, M + 14, y - 18, 11, ink);
    let row = y - 34;
    for (const line of lines) {
      drawText(page, fonts.sans, line, M + 14, row, 9, ink);
      row -= 12;
    }
    y -= height + 8;
  }

  page.drawRectangle({ x: M, y: 22, width: CONTENT_W, height: 0.6, color: line });
  drawText(page, fonts.sans, "Relify  ·  itsrelify.com", M, 16, 8, muted);
  const saved = await doc.save({ useObjectStreams: false });
  const copy = new Uint8Array(saved.byteLength);
  copy.set(saved);
  return copy as Uint8Array<ArrayBuffer>;
}

function drawLetterhead(page: PDFPage, fonts: Fonts, logo: PDFImage) {
  page.drawRectangle({ x: 0, y: PAGE_H - 52, width: PAGE_W, height: 52, color: ice });
  page.drawRectangle({ x: 0, y: PAGE_H - 52, width: PAGE_W, height: 4, color: clay });
  const height = 22;
  const width = (brandLogoSize.width / brandLogoSize.height) * height;
  page.drawImage(logo, { x: M, y: PAGE_H - 40, width, height });
  drawText(page, fonts.sansSemi, "CONFIDENCIAL  ·  LOI", PAGE_W - M - fonts.sansSemi.widthOfTextAtSize("CONFIDENCIAL  ·  LOI", 8), PAGE_H - 32, 8, clay);
}

export function sampleLoiTemplateView(): LoiTemplateView {
  return {
    buyerName: "Laura Vidal",
    codename: "Proyecto Quercus",
    region: "Madrid",
    askingPrice: "4 M €",
    structure: "Compraventa de participaciones. El vendedor puede financiar hasta el 20 % a 3 años.",
    dateLabel: "11 de noviembre de 2026",
  };
}
