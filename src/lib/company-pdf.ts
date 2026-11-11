import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { formatCardEur } from "./money";
import { foundedDecade } from "./market-filters";
import { headcountLabels, type HeadcountRangeId } from "./company-profile";
import { reportHeadline } from "./company-report";
import { cnaeDisplayTitle, formatCnaeCode } from "./cnae-2009";
import { saleReasonLabels, type SaleReason } from "./company-draft";
import { sellerFinancingChip, type SellerFinancing } from "./seller-financing";
import { sellerStayText, type SellerStay } from "./seller-stay";
import type { SabiYear } from "./sabi/insights";

export const companyPdfCopy = {
  teaserTitle: "Perfil ciego",
  dossierTitle: "Cuaderno de venta",
  teaserFile: "relify-perfil-ciego",
  dossierFile: "relify-cuaderno-de-venta",
  brand: "Relify",
  site: "itsrelify.com",
  confidential: "Confidencial",
  teaserNote:
    "Este documento muestra solo lo que ya es público en Relify: nombre de proyecto y cifras de cabecera. La sociedad no figura.",
  dossierNote:
    "Cuaderno de venta para una conexión con NDA aceptado. La razón social sigue fuera. Cada página lleva una marca de agua del comprador.",
  sellerTitle: "Informes de la ficha",
  sellerBody: "El perfil ciego se puede compartir sin el nombre. El cuaderno de venta llega al comprador después del NDA.",
  teaserDownload: "Descargar perfil ciego",
  shareLabel: "Enlace público",
  shareHint: "El enlace público se activa al publicar. Quien lo abre ve el mismo perfil ciego, sin la sociedad.",
  dossierDownload: "Descargar cuaderno de venta",
  generated: "Generado el",
} as const;

export type CompanyPdfKind = "teaser" | "dossier";

export type CompanyPdfKpi = { label: string; value: string };

export type CompanyPdfYear = { year: number; revenue: string; ebitda: string };

export type CompanyPdfView = {
  kind: CompanyPdfKind;
  codename: string;
  region: string;
  cnae: string | null;
  decade: string | null;
  headcount: string | null;
  summary: string | null;
  saleReason: string | null;
  financing: string | null;
  stay: string | null;
  kpis: CompanyPdfKpi[];
  years: CompanyPdfYear[];
  generatedLabel: string;
  watermark: string | null;
};

const ink = rgb(18 / 255, 52 / 255, 58 / 255);
const clay = rgb(15 / 255, 110 / 255, 115 / 255);
const muted = rgb(92 / 255, 107 / 255, 120 / 255);
const paper = rgb(229 / 255, 238 / 255, 240 / 255);
const white = rgb(1, 1, 1);
const line = rgb(221 / 255, 231 / 255, 234 / 255);

const identityLeak = [
  /\blegalName\b/i,
  /\bcif\b/i,
  /raz[oó]n social/i,
  /\bB\d{8}\b/,
  /\bA\d{8}[A-Z0-9]\b/,
  /avenida/i,
  /\bcalle\b/i,
];

export function companyPdfHasIdentity(view: CompanyPdfView): boolean {
  const blob = JSON.stringify(view);
  return identityLeak.some((pattern) => pattern.test(blob));
}

function pdfSafe(value: string): string {
  return value
    .replaceAll("€", "EUR")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("·", " · ");
}

function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (font.widthOfTextAtSize(next, size) <= width) {
      current = next;
      continue;
    }
    if (current.length > 0) {
      lines.push(current);
    }
    current = word;
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  color: RGB,
) {
  page.drawText(pdfSafe(text), { x, y, size, font, color });
}

function drawHeader(page: PDFPage, font: PDFFont, bold: PDFFont, title: string, width: number, height: number) {
  page.drawRectangle({ x: 0, y: height - 64, width, height: 64, color: ink });
  page.drawRectangle({ x: 0, y: height - 68, width, height: 4, color: clay });
  drawText(page, bold, companyPdfCopy.brand, 48, height - 42, 18, white);
  const titleWidth = bold.widthOfTextAtSize(pdfSafe(title), 11);
  drawText(page, bold, title, width - 48 - titleWidth, height - 40, 11, paper);
}

function drawFooter(page: PDFPage, font: PDFFont, pageIndex: number, total: number, width: number) {
  page.drawRectangle({ x: 48, y: 36, width: width - 96, height: 0.6, color: line });
  drawText(page, font, `${companyPdfCopy.brand}  ${companyPdfCopy.site}`, 48, 22, 8, muted);
  const label = `${pageIndex + 1} / ${total}`;
  const labelWidth = font.widthOfTextAtSize(label, 8);
  drawText(page, font, label, width - 48 - labelWidth, 22, 8, muted);
}

function drawWatermark(page: PDFPage, font: PDFFont, text: string, width: number, height: number) {
  const safe = pdfSafe(text);
  page.drawText(safe, {
    x: 90,
    y: height / 2 - 20,
    size: 18,
    font,
    color: rgb(15 / 255, 110 / 255, 115 / 255),
    rotate: degrees(32),
    opacity: 0.12,
  });
}

function drawKpis(page: PDFPage, font: PDFFont, bold: PDFFont, kpis: CompanyPdfKpi[], y: number, width: number) {
  const gap = 10;
  const boxWidth = (width - 96 - gap * (kpis.length - 1)) / kpis.length;
  kpis.forEach((kpi, index) => {
    const x = 48 + index * (boxWidth + gap);
    page.drawRectangle({ x, y: y - 52, width: boxWidth, height: 58, color: paper, borderColor: line, borderWidth: 0.6 });
    drawText(page, font, kpi.label, x + 10, y - 12, 8, muted);
    drawText(page, bold, kpi.value, x + 10, y - 36, 13, ink);
  });
}

function drawBars(page: PDFPage, years: CompanyPdfYear[], x: number, y: number, width: number, height: number) {
  if (years.length === 0) {
    return;
  }
  const peak = Math.max(
    ...years.map((row) => {
      const n = Number.parseFloat(row.revenue.replace(/[^\d,]/g, "").replace(",", "."));
      return Number.isFinite(n) ? n : 1;
    }),
    1,
  );
  const barWidth = Math.min(36, (width / years.length) * 0.46);
  years.forEach((row, index) => {
    const n = Number.parseFloat(row.revenue.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    const barHeight = Math.max(8, (n / peak) * height);
    const cx = x + (index + 0.5) * (width / years.length) - barWidth / 2;
    page.drawRectangle({ x: cx, y, width: barWidth, height: barHeight, color: clay });
  });
}

export async function buildCompanyPdf(view: CompanyPdfView): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const title = view.kind === "teaser" ? companyPdfCopy.teaserTitle : companyPdfCopy.dossierTitle;
  const note = view.kind === "teaser" ? companyPdfCopy.teaserNote : companyPdfCopy.dossierNote;
  const needsYears = view.years.length > 0;
  const pageCount = needsYears || view.kind === "dossier" ? 2 : 1;
  const pages: PDFPage[] = [];

  for (let index = 0; index < pageCount; index += 1) {
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    page.drawRectangle({ x: 0, y: 0, width, height, color: white });
    drawHeader(page, font, bold, title, width, height);
    if (view.watermark) {
      drawWatermark(page, bold, view.watermark, width, height);
    }
    pages.push(page);
  }

  const first = pages[0];
  if (!first) {
    throw new Error("company pdf missing first page");
  }
  const { width, height } = first.getSize();
  let y = height - 96;
  drawText(first, font, companyPdfCopy.confidential, 48, y, 9, clay);
  y -= 22;
  drawText(first, bold, view.codename, 48, y, 22, ink);
  y -= 18;
  const meta = [view.region, view.cnae, view.decade, view.headcount].filter((item): item is string => Boolean(item));
  drawText(first, font, meta.join("  ·  "), 48, y, 10, muted);
  y -= 28;
  drawKpis(first, font, bold, view.kpis, y, width);
  y -= 78;
  if (view.summary) {
    drawText(first, bold, "Actividad", 48, y, 11, ink);
    y -= 16;
    for (const line of wrap(font, view.summary, 10, width - 96).slice(0, 8)) {
      drawText(first, font, line, 48, y, 10, ink);
      y -= 14;
    }
  }
  if (view.kind === "dossier") {
    y -= 8;
    const extras = [
      view.saleReason ? `Motivo de venta: ${view.saleReason}` : null,
      view.financing ? `Financiación: ${view.financing}` : null,
      view.stay ? `Tras la venta: ${view.stay}` : null,
    ].filter((item): item is string => Boolean(item));
    for (const line of extras) {
      drawText(first, font, line, 48, y, 10, ink);
      y -= 14;
    }
  }
  y -= 10;
  for (const line of wrap(font, note, 9, width - 96)) {
    drawText(first, font, line, 48, y, 9, muted);
    y -= 12;
  }
  drawText(first, font, `${companyPdfCopy.generated} ${view.generatedLabel}`, 48, 56, 8, muted);

  const second = pages[1];
  if (second && needsYears) {
    let rowY = height - 110;
    drawText(second, bold, "Evolución (ejercicios cerrados)", 48, rowY, 14, ink);
    rowY -= 22;
    drawBars(second, view.years, 48, rowY - 120, width - 96, 110);
    rowY -= 148;
    drawText(second, bold, "Ejercicio", 48, rowY, 9, muted);
    drawText(second, bold, "Facturación", 220, rowY, 9, muted);
    drawText(second, bold, "EBITDA", 380, rowY, 9, muted);
    rowY -= 8;
    second.drawRectangle({ x: 48, y: rowY, width: width - 96, height: 0.6, color: line });
    rowY -= 18;
    for (const year of view.years) {
      drawText(second, font, String(year.year), 48, rowY, 10, ink);
      drawText(second, font, year.revenue, 220, rowY, 10, ink);
      drawText(second, font, year.ebitda, 380, rowY, 10, ink);
      rowY -= 18;
    }
  }

  pages.forEach((page, index) => {
    drawFooter(page, font, index, pages.length, page.getSize().width);
  });

  const saved = await doc.save({ useObjectStreams: false });
  const copy = new Uint8Array(saved.byteLength);
  copy.set(saved);
  return copy;
}

export function companyPdfFileName(kind: CompanyPdfKind, codename: string): string {
  const slug = codename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const base = kind === "teaser" ? companyPdfCopy.teaserFile : companyPdfCopy.dossierFile;
  return `${base}-${slug || "proyecto"}.pdf`;
}

export function headlineKpis(input: {
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  ebitdaAdjustments?: unknown;
  reportYears?: SabiYear[] | null;
  figuresVeiled?: boolean;
}): CompanyPdfKpi[] {
  const headline = reportHeadline({ ...input, ebitdaAdjustments: input.ebitdaAdjustments ?? null });
  const ebitdaLabel = headline.hasApprovedAdjustments ? "EBITDA aj." : "EBITDA";
  const ebitdaValue = headline.hasApprovedAdjustments ? headline.adjustedEbitdaCents : headline.ebitdaCents;
  return [
    { label: "Facturación", value: formatCardEur(headline.revenueCents) },
    { label: ebitdaLabel, value: formatCardEur(ebitdaValue) },
    { label: "Precio", value: formatCardEur(input.askingPriceCents) },
  ];
}

function cnaeLine(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  return `${formatCnaeCode(code)} · ${cnaeDisplayTitle(code)}`;
}

function saleReasonLine(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value in saleReasonLabels ? saleReasonLabels[value as SaleReason] : value;
}

export function teaserViewFromPublic(input: {
  codename: string;
  region: string;
  cnaeCode?: string | null;
  foundedYear?: number | null;
  headcount?: HeadcountRangeId | null;
  summary?: string | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  ebitdaAdjustments?: unknown;
  generatedLabel: string;
}): CompanyPdfView {
  return {
    kind: "teaser",
    codename: input.codename,
    region: input.region,
    cnae: cnaeLine(input.cnaeCode),
    decade: foundedDecade(input.foundedYear),
    headcount: input.headcount ? headcountLabels[input.headcount] : null,
    summary: input.summary?.trim() || null,
    saleReason: null,
    financing: null,
    stay: null,
    kpis: headlineKpis(input),
    years: [],
    generatedLabel: input.generatedLabel,
    watermark: null,
  };
}

export function dossierViewFromInvestor(input: {
  codename: string;
  region: string;
  principalCnae?: { code: string } | null;
  foundedYear?: number | null;
  headcountRange?: HeadcountRangeId | null;
  description?: string | null;
  saleReason?: string | null;
  sellerFinancing?: SellerFinancing | null;
  sellerStay?: SellerStay | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  ebitdaAdjustments?: unknown;
  reportYears?: SabiYear[] | null;
  generatedLabel: string;
  watermark: string;
}): CompanyPdfView {
  const years = (input.reportYears ?? [])
    .filter((year) => year.revenueCents !== null || year.ebitdaCents !== null)
    .map((year) => ({
      year: year.year,
      revenue: year.revenueCents === null ? "—" : formatCardEur(year.revenueCents),
      ebitda: year.ebitdaCents === null ? "—" : formatCardEur(year.ebitdaCents),
    }));
  return {
    kind: "dossier",
    codename: input.codename,
    region: input.region,
    cnae: cnaeLine(input.principalCnae?.code),
    decade: foundedDecade(input.foundedYear),
    headcount: input.headcountRange ? headcountLabels[input.headcountRange] : null,
    summary: input.description?.trim() || null,
    saleReason: saleReasonLine(input.saleReason),
    financing: sellerFinancingChip(input.sellerFinancing ?? null),
    stay: input.sellerStay ? sellerStayText(input.sellerStay) : null,
    kpis: headlineKpis(input),
    years,
    generatedLabel: input.generatedLabel,
    watermark: input.watermark,
  };
}

export function sampleTeaserView(): CompanyPdfView {
  return teaserViewFromPublic({
    codename: "Proyecto Alba",
    region: "Valencia",
    cnaeCode: "25.11",
    foundedYear: 2009,
    headcount: "band_11_20",
    summary: "Taller industrial con cartera de obras y un equipo técnico consolidado. La ficha pública no muestra la sociedad.",
    revenueCents: 125_000_000,
    ebitdaCents: 31_000_000,
    adjustedEbitdaCents: 34_000_000,
    askingPriceCents: 98_000_000,
    ebitdaAdjustments: [{ type: "owner_salary", amountCents: 3_000_000, reason: "ajuste", status: "approved" }],
    generatedLabel: "11 de noviembre de 2026",
  });
}

export function sampleDossierView(): CompanyPdfView {
  return dossierViewFromInvestor({
    codename: "Proyecto Alba",
    region: "Valencia",
    principalCnae: { code: "25.11" },
    foundedYear: 2009,
    headcountRange: "band_11_20",
    description: "Taller industrial con cartera de obras y un equipo técnico consolidado.",
    saleReason: "jubilacion",
    sellerFinancing: { mode: "yes", maxPct: 20, years: 3 },
    sellerStay: "6m",
    askingPriceCents: 98_000_000,
    revenueCents: 125_000_000,
    ebitdaCents: 31_000_000,
    adjustedEbitdaCents: 34_000_000,
    ebitdaAdjustments: [{ type: "owner_salary", amountCents: 3_000_000, reason: "ajuste", status: "approved" }],
    reportYears: [
      { year: 2022, months: 12, employees: 14, revenueCents: 82_000_000, suppliesCents: null, staffCostsCents: null, ebitdaCents: 14_000_000, ebitCents: null, financialResultCents: null, profitBeforeTaxCents: null, netResultCents: null, totalAssetsCents: null, nonCurrentAssetsCents: null, currentAssetsCents: null, cashCents: null, equityCents: null, nonCurrentLiabilitiesCents: null, currentLiabilitiesCents: null, longTermDebtCents: null, shortTermDebtCents: null, workingCapitalCents: null, ratios: {} },
      { year: 2023, months: 12, employees: 15, revenueCents: 96_000_000, suppliesCents: null, staffCostsCents: null, ebitdaCents: 19_000_000, ebitCents: null, financialResultCents: null, profitBeforeTaxCents: null, netResultCents: null, totalAssetsCents: null, nonCurrentAssetsCents: null, currentAssetsCents: null, cashCents: null, equityCents: null, nonCurrentLiabilitiesCents: null, currentLiabilitiesCents: null, longTermDebtCents: null, shortTermDebtCents: null, workingCapitalCents: null, ratios: {} },
      { year: 2024, months: 12, employees: 16, revenueCents: 110_000_000, suppliesCents: null, staffCostsCents: null, ebitdaCents: 25_000_000, ebitCents: null, financialResultCents: null, profitBeforeTaxCents: null, netResultCents: null, totalAssetsCents: null, nonCurrentAssetsCents: null, currentAssetsCents: null, cashCents: null, equityCents: null, nonCurrentLiabilitiesCents: null, currentLiabilitiesCents: null, longTermDebtCents: null, shortTermDebtCents: null, workingCapitalCents: null, ratios: {} },
      { year: 2025, months: 12, employees: 18, revenueCents: 125_000_000, suppliesCents: null, staffCostsCents: null, ebitdaCents: 31_000_000, ebitCents: null, financialResultCents: null, profitBeforeTaxCents: null, netResultCents: null, totalAssetsCents: null, nonCurrentAssetsCents: null, currentAssetsCents: null, cashCents: null, equityCents: null, nonCurrentLiabilitiesCents: null, currentLiabilitiesCents: null, longTermDebtCents: null, shortTermDebtCents: null, workingCapitalCents: null, ratios: {} },
    ],
    generatedLabel: "11 de noviembre de 2026",
    watermark: "Ana Pérez · ana.perez@example.com · 11 de noviembre de 2026",
  });
}
