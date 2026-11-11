import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { formatCardEur, formatDecimal } from "./money";
import { foundedDecade } from "./market-filters";
import { ebitdaMarginBasisPoints, headcountLabels, type HeadcountRangeId } from "./company-profile";
import { reportHeadline } from "./company-report";
import { cnaeDisplayTitle, formatCnaeCode } from "./cnae-2009";
import { saleReasonLabels, type SaleReason } from "./company-draft";
import { sellerFinancingChip, type SellerFinancing } from "./seller-financing";
import { sellerStayText, type SellerStay } from "./seller-stay";
import {
  capexToSalesAverage,
  collectionDaysOf,
  creditDaysOf,
  ebitdaToCashConversion,
  headlineLeverage,
  nofCents,
} from "./financial-metrics";
import { netDebtCents, type SabiYear } from "./sabi/insights";
import { estimatePriceRange } from "./valuation-multiples";

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

export type CompanyPdfYear = {
  year: number;
  revenueCents: number | null;
  ebitdaCents: number | null;
  employees: number | null;
};

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
  ratios: CompanyPdfKpi[];
  marginPct: number | null;
  priceLow: string | null;
  priceHigh: string | null;
  asking: string;
  generatedLabel: string;
  watermark: string | null;
};

const ink = rgb(18 / 255, 52 / 255, 58 / 255);
const clay = rgb(15 / 255, 110 / 255, 115 / 255);
const moss = rgb(28 / 255, 95 / 255, 88 / 255);
const muted = rgb(92 / 255, 107 / 255, 120 / 255);
const paper = rgb(229 / 255, 238 / 255, 240 / 255);
const sand = rgb(244 / 255, 248 / 255, 248 / 255);
const white = rgb(1, 1, 1);
const line = rgb(221 / 255, 231 / 255, 234 / 255);
const mist = rgb(238 / 255, 246 / 255, 244 / 255);

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

function drawLogo(page: PDFPage, bold: PDFFont, x: number, y: number, onDark: boolean) {
  page.drawRectangle({ x, y: y - 4, width: 22, height: 22, color: onDark ? white : clay });
  drawText(page, bold, "R", x + 6, y + 1, 13, onDark ? clay : white);
  drawText(page, bold, companyPdfCopy.brand, x + 30, y, 16, onDark ? white : ink);
}

function drawFooter(page: PDFPage, font: PDFFont, pageIndex: number, total: number, width: number) {
  page.drawRectangle({ x: 40, y: 32, width: width - 80, height: 0.6, color: line });
  drawText(page, font, `${companyPdfCopy.brand}  ${companyPdfCopy.site}`, 40, 18, 8, muted);
  const label = `${pageIndex + 1} / ${total}`;
  const labelWidth = font.widthOfTextAtSize(label, 8);
  drawText(page, font, label, width - 40 - labelWidth, 18, 8, muted);
}

function drawWatermark(page: PDFPage, font: PDFFont, text: string, width: number, height: number) {
  const safe = pdfSafe(text);
  page.drawText(safe, {
    x: 72,
    y: height / 2 - 24,
    size: 16,
    font,
    color: rgb(15 / 255, 110 / 255, 115 / 255),
    rotate: degrees(28),
    opacity: 0.1,
  });
}

function drawKpiGrid(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  kpis: CompanyPdfKpi[],
  x: number,
  y: number,
  width: number,
) {
  const gap = 10;
  const cols = Math.min(4, Math.max(1, kpis.length));
  const boxWidth = (width - gap * (cols - 1)) / cols;
  kpis.forEach((kpi, index) => {
    const left = x + index * (boxWidth + gap);
    page.drawRectangle({
      x: left,
      y: y - 58,
      width: boxWidth,
      height: 64,
      color: sand,
      borderColor: line,
      borderWidth: 0.8,
    });
    page.drawRectangle({ x: left, y: y + 4, width: 18, height: 3, color: clay });
    drawText(page, font, kpi.label, left + 10, y - 10, 8, muted);
    drawText(page, bold, kpi.value, left + 10, y - 36, 13, ink);
  });
}

function centsPeak(years: CompanyPdfYear[], key: "revenueCents" | "ebitdaCents"): number {
  const values = years.map((row) => row[key]).filter((value): value is number => value !== null && value > 0);
  return Math.max(...values, 1);
}

function drawGroupedBars(
  page: PDFPage,
  font: PDFFont,
  years: CompanyPdfYear[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (years.length === 0) {
    return;
  }
  const revenuePeak = centsPeak(years, "revenueCents");
  const group = width / years.length;
  const bar = Math.min(16, group * 0.22);
  years.forEach((row, index) => {
    const cx = x + index * group + group / 2;
    const revenue = row.revenueCents ?? 0;
    const ebitda = row.ebitdaCents ?? 0;
    const revenueH = Math.max(4, (Math.max(revenue, 0) / revenuePeak) * height);
    const ebitdaH = Math.max(4, (Math.max(ebitda, 0) / revenuePeak) * height);
    page.drawRectangle({ x: cx - bar - 2, y, width: bar, height: revenueH, color: clay });
    page.drawRectangle({ x: cx + 2, y, width: bar, height: ebitdaH, color: ink });
    const label = String(row.year);
    const labelWidth = font.widthOfTextAtSize(label, 8);
    drawText(page, font, label, cx - labelWidth / 2, y - 14, 8, muted);
  });
}

function drawMarginMeter(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  pct: number | null,
  x: number,
  y: number,
  width: number,
) {
  page.drawRectangle({ x, y, width, height: 62, color: sand, borderColor: line, borderWidth: 0.7 });
  drawText(page, font, "Margen EBITDA (último ejercicio publicado)", x + 14, y + 42, 8, muted);
  const track = width - 28;
  page.drawRectangle({ x: x + 14, y: y + 14, width: track, height: 8, color: paper });
  if (pct === null) {
    drawText(page, bold, "-", x + 14, y + 28, 12, ink);
    return;
  }
  const clamped = Math.min(100, Math.max(0, pct));
  page.drawRectangle({ x: x + 14, y: y + 14, width: Math.max(6, (clamped / 100) * track), height: 8, color: clay });
  const label = `${Math.round(clamped)} %`;
  const labelWidth = bold.widthOfTextAtSize(label, 13);
  drawText(page, bold, label, x + width - 14 - labelWidth, y + 38, 13, ink);
}

function drawPriceRange(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  view: CompanyPdfView,
  x: number,
  y: number,
  width: number,
) {
  page.drawRectangle({ x, y, width, height: 78, color: mist, borderColor: line, borderWidth: 0.7 });
  drawText(page, bold, "Rango orientativo de precio", x + 14, y + 56, 10, ink);
  const low = view.priceLow ?? "-";
  const high = view.priceHigh ?? "-";
  drawText(page, font, `${low}  -  ${high}`, x + 14, y + 40, 9, muted);
  const askLabel = `Publicado ${pdfSafe(view.asking)}`;
  const askWidth = bold.widthOfTextAtSize(askLabel, 9);
  drawText(page, bold, askLabel, x + width - 14 - askWidth, y + 40, 9, ink);
  const track = width - 28;
  page.drawRectangle({ x: x + 14, y: y + 18, width: track, height: 7, color: paper });
  page.drawRectangle({ x: x + 14, y: y + 18, width: track * 0.72, height: 7, color: clay });
}

function drawCover(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  view: CompanyPdfView,
  width: number,
  height: number,
) {
  const title = view.kind === "teaser" ? companyPdfCopy.teaserTitle : companyPdfCopy.dossierTitle;
  page.drawRectangle({ x: 0, y: height - 168, width, height: 168, color: moss });
  page.drawRectangle({ x: 0, y: height - 172, width, height: 4, color: clay });
  drawLogo(page, bold, 40, height - 48, true);
  drawText(page, font, companyPdfCopy.confidential.toUpperCase(), 40, height - 78, 9, rgb(0.78, 0.9, 0.88));
  drawText(page, bold, title.toUpperCase(), 40, height - 104, 11, white);
  drawText(page, bold, view.codename, 40, height - 138, 26, white);
  const chips = [view.region, view.cnae, view.decade, view.headcount].filter((item): item is string => Boolean(item));
  let chipX = 40;
  chips.slice(0, 4).forEach((chip) => {
    const label = pdfSafe(chip);
    const chipWidth = Math.min(220, font.widthOfTextAtSize(label, 8) + 16);
    page.drawRectangle({ x: chipX, y: height - 210, width: chipWidth, height: 18, color: sand });
    drawText(page, font, chip, chipX + 8, height - 204, 8, ink);
    chipX += chipWidth + 8;
  });
  const coverKpis =
    view.marginPct === null
      ? view.kpis
      : [...view.kpis, { label: "Margen EBITDA", value: `${Math.round(view.marginPct)} %` }].slice(0, 4);
  drawKpiGrid(page, font, bold, coverKpis, 40, height - 248, width - 80);
  drawPriceRange(page, font, bold, view, 40, height - 390, width - 80);
  let y = height - 430;
  if (view.summary) {
    drawText(page, bold, "Actividad", 40, y, 12, ink);
    y -= 18;
    for (const row of wrap(font, view.summary, 10, width - 80).slice(0, 7)) {
      drawText(page, font, row, 40, y, 10, ink);
      y -= 14;
    }
  }
  if (view.kind === "dossier") {
    y -= 8;
    const extras = [
      view.saleReason ? `Motivo de venta: ${view.saleReason}` : null,
      view.financing ? `Financiación del vendedor: ${view.financing}` : null,
      view.stay ? `Tras la venta: ${view.stay}` : null,
    ].filter((item): item is string => Boolean(item));
    for (const row of extras) {
      page.drawRectangle({ x: 40, y: y - 8, width: width - 80, height: 22, color: sand });
      drawText(page, font, row, 50, y, 10, ink);
      y -= 28;
    }
  }
  const note = view.kind === "teaser" ? companyPdfCopy.teaserNote : companyPdfCopy.dossierNote;
  y = Math.min(y, 96);
  for (const row of wrap(font, note, 8, width - 80)) {
    drawText(page, font, row, 40, y, 8, muted);
    y -= 11;
  }
  drawText(page, font, `${companyPdfCopy.generated} ${view.generatedLabel}`, 40, 48, 8, muted);
}

function drawFigures(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  view: CompanyPdfView,
  width: number,
  height: number,
) {
  drawLogo(page, bold, 40, height - 48, false);
  drawText(page, bold, "Evolución de cifras", 40, height - 78, 16, ink);
  drawText(page, font, "Facturación y EBITDA de los ejercicios cerrados. Importes en EUR.", 40, height - 96, 9, muted);
  const chartTop = height - 300;
  page.drawRectangle({ x: 40, y: height - 116, width: 8, height: 8, color: clay });
  drawText(page, font, "Facturación", 52, height - 114, 8, clay);
  page.drawRectangle({ x: 128, y: height - 116, width: 8, height: 8, color: ink });
  drawText(page, font, "EBITDA", 140, height - 114, 8, ink);
  page.drawRectangle({
    x: 40,
    y: chartTop,
    width: width - 80,
    height: 168,
    color: sand,
    borderColor: line,
    borderWidth: 0.7,
  });
  drawGroupedBars(page, font, view.years, 56, chartTop + 24, width - 112, 118);
  drawMarginMeter(page, font, bold, view.marginPct, 40, chartTop - 86, width - 80);
  let rowY = chartTop - 122;
  drawText(page, bold, "Ejercicio", 48, rowY, 9, muted);
  drawText(page, bold, "Facturación", 150, rowY, 9, muted);
  drawText(page, bold, "EBITDA", 310, rowY, 9, muted);
  drawText(page, bold, "Plantilla", 450, rowY, 9, muted);
  rowY -= 8;
  page.drawRectangle({ x: 40, y: rowY, width: width - 80, height: 0.6, color: line });
  rowY -= 18;
  for (const year of view.years) {
    drawText(page, font, String(year.year), 48, rowY, 10, ink);
    drawText(page, font, year.revenueCents === null ? "-" : formatCardEur(year.revenueCents), 150, rowY, 10, ink);
    drawText(page, font, year.ebitdaCents === null ? "-" : formatCardEur(year.ebitdaCents), 310, rowY, 10, ink);
    drawText(page, font, year.employees === null ? "-" : String(year.employees), 450, rowY, 10, ink);
    rowY -= 18;
  }
}

function drawDossierOps(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  view: CompanyPdfView,
  width: number,
  height: number,
) {
  drawLogo(page, bold, 40, height - 48, false);
  drawText(page, bold, "Ratios operativos (SABI)", 40, height - 78, 16, ink);
  drawText(
    page,
    font,
    "Deuda neta, NOF, conversión a caja y plazos. Solo en el cuaderno post-NDA.",
    40,
    height - 96,
    9,
    muted,
  );
  const gap = 10;
  const cols = 3;
  const boxW = (width - 80 - gap * (cols - 1)) / cols;
  view.ratios.slice(0, 9).forEach((kpi, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 40 + col * (boxW + gap);
    const y = height - 220 - row * 90;
    page.drawRectangle({ x, y, width: boxW, height: 76, color: sand, borderColor: line, borderWidth: 0.7 });
    page.drawRectangle({ x, y: y + 73, width: 22, height: 3, color: clay });
    drawText(page, font, kpi.label, x + 12, y + 50, 8, muted);
    drawText(page, bold, kpi.value, x + 12, y + 24, 13, ink);
  });
}

export async function buildCompanyPdf(view: CompanyPdfView): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages: PDFPage[] = [];
  const addPage = () => {
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    page.drawRectangle({ x: 0, y: 0, width, height, color: white });
    if (view.watermark) {
      drawWatermark(page, bold, view.watermark, width, height);
    }
    pages.push(page);
    return page;
  };

  const cover = addPage();
  drawCover(cover, font, bold, view, cover.getSize().width, cover.getSize().height);
  if (view.years.length > 0) {
    const figures = addPage();
    drawFigures(figures, font, bold, view, figures.getSize().width, figures.getSize().height);
  }
  if (view.kind === "dossier") {
    const ops = addPage();
    drawDossierOps(ops, font, bold, view, ops.getSize().width, ops.getSize().height);
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

function yearsFromSabi(years: SabiYear[] | null | undefined): CompanyPdfYear[] {
  return (years ?? [])
    .filter((year) => year.revenueCents !== null || year.ebitdaCents !== null)
    .map((year) => ({
      year: year.year,
      revenueCents: year.revenueCents,
      ebitdaCents: year.ebitdaCents,
      employees: year.employees,
    }));
}

function marginFromHeadline(input: {
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ebitdaAdjustments?: unknown;
  reportYears?: SabiYear[] | null;
  figuresVeiled?: boolean;
}): number | null {
  const headline = reportHeadline({ ...input, ebitdaAdjustments: input.ebitdaAdjustments ?? null });
  const ebitda = headline.hasApprovedAdjustments ? headline.adjustedEbitdaCents : headline.ebitdaCents;
  const bp = ebitdaMarginBasisPoints(ebitda, headline.revenueCents);
  return bp === null ? null : bp / 100;
}

function priceBand(input: {
  cnaeCode?: string | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  askingPriceCents: number;
  ebitdaAdjustments?: unknown;
  reportYears?: SabiYear[] | null;
  figuresVeiled?: boolean;
  headcount?: HeadcountRangeId | null;
}): { low: string | null; high: string | null; asking: string } {
  const headline = reportHeadline({ ...input, ebitdaAdjustments: input.ebitdaAdjustments ?? null });
  const ebitda = headline.hasApprovedAdjustments ? headline.adjustedEbitdaCents : headline.ebitdaCents;
  const estimate = estimatePriceRange({
    cnae: input.cnaeCode ?? null,
    ebitdaCents: ebitda,
    headcount: input.headcount ?? undefined,
  });
  return {
    low: estimate ? formatCardEur(estimate.lowCents) : null,
    high: estimate ? formatCardEur(estimate.highCents) : null,
    asking: formatCardEur(input.askingPriceCents),
  };
}

function dossierRatios(
  years: SabiYear[],
  input: { ebitdaCents: number; adjustedEbitdaCents: number; ebitdaAdjustments?: unknown },
): CompanyPdfKpi[] {
  const sorted = [...years].sort((left, right) => left.year - right.year);
  const last = sorted[sorted.length - 1] ?? null;
  const previous = sorted.length > 1 ? (sorted[sorted.length - 2] ?? null) : null;
  const headline = reportHeadline({
    revenueCents: last?.revenueCents ?? 0,
    ebitdaCents: input.ebitdaCents,
    adjustedEbitdaCents: input.adjustedEbitdaCents,
    ebitdaAdjustments: input.ebitdaAdjustments ?? null,
    reportYears: years,
  });
  const net = last ? netDebtCents(last) : null;
  const leverage = headlineLeverage({
    netDebtCents: net,
    ebitdaCents: last?.ebitdaCents ?? input.ebitdaCents,
    adjustedEbitdaCents: headline.hasApprovedAdjustments ? headline.adjustedEbitdaCents : null,
    hasApprovedAdjustments: headline.hasApprovedAdjustments,
  });
  const nof = last ? nofCents(last) : null;
  const conversion = last ? ebitdaToCashConversion(last, previous) : null;
  const capex = capexToSalesAverage(sorted);
  const pmc = last ? collectionDaysOf(last) : null;
  const pmp = last ? creditDaysOf(last) : null;
  const leverageValue = leverage.ns ? "n/s" : leverage.primaryTimes === null ? "—" : `${formatDecimal(leverage.primaryTimes, 2)}x`;
  const conversionValue =
    conversion === null ? "—" : conversion.ns ? "n/s" : conversion.ratio === null ? "—" : `${formatDecimal(conversion.ratio * 100, 0)} %`;
  return [
    { label: leverage.primaryLabel, value: leverageValue },
    { label: "NOF", value: nof === null ? "—" : formatCardEur(nof) },
    { label: "Conversión a caja", value: conversionValue },
    { label: "Capex / ventas", value: capex === null ? "—" : `${formatDecimal(capex, 1)} %` },
    { label: "Plantilla", value: last?.employees === null || last?.employees === undefined ? "—" : String(last.employees) },
    { label: "PMC (días)", value: pmc === null ? "—" : `${Math.round(pmc)} d` },
    { label: "PMP (días)", value: pmp === null ? "—" : `${Math.round(pmp)} d` },
    { label: "Deuda neta", value: net === null ? "—" : formatCardEur(net) },
  ];
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
  reportYears?: SabiYear[] | null;
  generatedLabel: string;
}): CompanyPdfView {
  const band = priceBand(input);
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
    years: yearsFromSabi(input.reportYears),
    ratios: [],
    marginPct: marginFromHeadline(input),
    priceLow: band.low,
    priceHigh: band.high,
    asking: band.asking,
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
  const years = input.reportYears ?? [];
  const band = priceBand({
    ...input,
    cnaeCode: input.principalCnae?.code,
    headcount: input.headcountRange,
  });
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
    years: yearsFromSabi(years),
    ratios: dossierRatios(years, input),
    marginPct: marginFromHeadline(input),
    priceLow: band.low,
    priceHigh: band.high,
    asking: band.asking,
    generatedLabel: input.generatedLabel,
    watermark: input.watermark,
  };
}

export function sabiYearsFromTeaserRows(
  rows: Array<{
    year: number;
    months: number | null;
    employees: number | null;
    salesCents: bigint | number | null;
    ebitdaCents: bigint | number | null;
  }>,
): SabiYear[] {
  return rows.map((row) =>
    blankYear({
      year: row.year,
      months: row.months,
      employees: row.employees,
      revenueCents: row.salesCents === null ? null : Number(row.salesCents),
      ebitdaCents: row.ebitdaCents === null ? null : Number(row.ebitdaCents),
    }),
  );
}

function blankYear(partial: Partial<SabiYear> & Pick<SabiYear, "year">): SabiYear {
  return {
    months: 12,
    employees: null,
    revenueCents: null,
    suppliesCents: null,
    staffCostsCents: null,
    ebitdaCents: null,
    ebitCents: null,
    financialResultCents: null,
    profitBeforeTaxCents: null,
    netResultCents: null,
    totalAssetsCents: null,
    nonCurrentAssetsCents: null,
    currentAssetsCents: null,
    cashCents: null,
    equityCents: null,
    nonCurrentLiabilitiesCents: null,
    currentLiabilitiesCents: null,
    longTermDebtCents: null,
    shortTermDebtCents: null,
    workingCapitalCents: null,
    ratios: {},
    ...partial,
  };
}

/** INT Empresa Tecnologia closed years (prisma/int-tecnologia-years.sql). Identity stays off the PDF. */
export function tecnologiaClosedYears(): SabiYear[] {
  return [
    blankYear({
      year: 2021,
      employees: 24,
      revenueCents: 420_000_000,
      suppliesCents: -65_000_000,
      staffCostsCents: -175_000_000,
      ebitdaCents: 62_000_000,
      ebitCents: 50_000_000,
      netResultCents: 48_000_000,
      profitBeforeTaxCents: 50_000_000,
      financialResultCents: -2_000_000,
      currentAssetsCents: 140_000_000,
      cashCents: 25_000_000,
      nonCurrentAssetsCents: 170_000_000,
      totalAssetsCents: 310_000_000,
      currentLiabilitiesCents: 70_000_000,
      shortTermDebtCents: 15_000_000,
      longTermDebtCents: 45_000_000,
      nonCurrentLiabilitiesCents: 50_000_000,
      equityCents: 185_000_000,
      ratios: { collectionDays: 52, creditDays: 44 },
    }),
    blankYear({
      year: 2022,
      employees: 26,
      revenueCents: 430_000_000,
      suppliesCents: -70_000_000,
      staffCostsCents: -185_000_000,
      ebitdaCents: 62_000_000,
      ebitCents: 50_000_000,
      netResultCents: 50_000_000,
      profitBeforeTaxCents: 52_000_000,
      financialResultCents: -2_000_000,
      currentAssetsCents: 150_000_000,
      cashCents: 30_000_000,
      nonCurrentAssetsCents: 185_000_000,
      totalAssetsCents: 335_000_000,
      currentLiabilitiesCents: 75_000_000,
      shortTermDebtCents: 16_000_000,
      longTermDebtCents: 46_000_000,
      nonCurrentLiabilitiesCents: 52_000_000,
      equityCents: 200_000_000,
      ratios: { collectionDays: 50, creditDays: 42 },
    }),
    blankYear({
      year: 2023,
      employees: 29,
      revenueCents: 460_000_000,
      suppliesCents: -75_000_000,
      staffCostsCents: -198_000_000,
      ebitdaCents: 68_000_000,
      ebitCents: 55_000_000,
      netResultCents: 55_000_000,
      profitBeforeTaxCents: 58_000_000,
      financialResultCents: -3_000_000,
      currentAssetsCents: 160_000_000,
      cashCents: 35_000_000,
      nonCurrentAssetsCents: 200_000_000,
      totalAssetsCents: 360_000_000,
      currentLiabilitiesCents: 80_000_000,
      shortTermDebtCents: 18_000_000,
      longTermDebtCents: 48_000_000,
      nonCurrentLiabilitiesCents: 55_000_000,
      equityCents: 225_000_000,
      ratios: { collectionDays: 48, creditDays: 40 },
    }),
    blankYear({
      year: 2024,
      employees: 32,
      revenueCents: 500_000_000,
      suppliesCents: -80_000_000,
      staffCostsCents: -210_000_000,
      ebitdaCents: 75_000_000,
      ebitCents: 60_000_000,
      netResultCents: 60_000_000,
      profitBeforeTaxCents: 63_000_000,
      financialResultCents: -3_000_000,
      currentAssetsCents: 180_000_000,
      cashCents: 40_000_000,
      nonCurrentAssetsCents: 220_000_000,
      totalAssetsCents: 400_000_000,
      currentLiabilitiesCents: 90_000_000,
      shortTermDebtCents: 20_000_000,
      longTermDebtCents: 50_000_000,
      nonCurrentLiabilitiesCents: 60_000_000,
      equityCents: 250_000_000,
      ratios: { collectionDays: 45, creditDays: 38 },
    }),
  ];
}

const quercusHeadline = {
  codename: "Proyecto Quercus",
  region: "Madrid",
  revenueCents: 500_000_000,
  ebitdaCents: 75_000_000,
  adjustedEbitdaCents: 80_000_000,
  askingPriceCents: 400_000_000,
  ebitdaAdjustments: [{ type: "owner_salary", amountCents: 5_000_000, reason: "ajuste", status: "approved" }],
  generatedLabel: "11 de noviembre de 2026",
} as const;

export function sampleTeaserView(): CompanyPdfView {
  return teaserViewFromPublic({
    ...quercusHeadline,
    cnaeCode: "62.01",
    foundedYear: 2014,
    headcount: "band_21_50",
    summary:
      "Software de gestion para pymes industriales. La ficha publica enseña el nombre de proyecto y las cifras de cabecera; la sociedad no figura.",
    reportYears: tecnologiaClosedYears(),
  });
}

export function sampleDossierView(): CompanyPdfView {
  return dossierViewFromInvestor({
    ...quercusHeadline,
    principalCnae: { code: "62.01" },
    foundedYear: 2014,
    headcountRange: "band_21_50",
    description:
      "Software de gestion para pymes industriales, con ingresos recurrentes y un equipo tecnico consolidado.",
    saleReason: "jubilacion",
    sellerFinancing: { mode: "yes", maxPct: 20, years: 3 },
    sellerStay: "6m",
    reportYears: tecnologiaClosedYears(),
    watermark: "Ana Pérez · ana.perez@example.com · 11 de noviembre de 2026",
  });
}
