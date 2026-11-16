import { PDFDocument, degrees, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import { brandLogoJpegBase64, brandLogoSize } from "./brand-logo-jpeg";
import { pdfFontkit } from "./pdf-fontkit";
import { dmSansRegular, dmSansSemiBold, geistRegular, geistSemiBold } from "./pdf-fonts";
import { formatCardEur, formatDecimal } from "./money";
import { foundedDecade } from "./market-filters";
import { ebitdaMarginBasisPoints, headcountLabels, type HeadcountRangeId } from "./company-profile";
import { reportHeadline } from "./company-report";
import { cnaeDisplayTitle, formatCnaeCode } from "./cnae-2009";
import { saleReasonLabels, type SaleReason } from "./company-draft";
import { sellerFinancingText, type SellerFinancing } from "./seller-financing";
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
import {
  ebitdaTrend,
  estimatePriceRange,
  formatMultiple,
  priceBarEnds,
  priceBarPosition,
  priceBarZone,
} from "./valuation-multiples";
import { approvedAdjustments, ebitdaAdjustmentLabels, storedEbitdaAdjustments } from "./ebitda-adjustments";
import { drawLucideIcon, type LucidePdfIcon } from "./pdf-icons";
import { companyPdfCopy } from "./company-pdf-copy";

export { companyPdfCopy };

export type CompanyPdfKind = "teaser" | "dossier";

export type CompanyPdfKpi = { label: string; value: string };

export type CompanyPdfYear = {
  year: number;
  revenueCents: number | null;
  ebitdaCents: number | null;
  ebitCents: number | null;
  netResultCents: number | null;
  employees: number | null;
  collectionDays: number | null;
  creditDays: number | null;
};

export type CompanyPdfGauge = {
  label: string;
  value: string;
  fill: number;
  hint: string;
};

export type CompanyPdfBridgeRow = {
  label: string;
  cents: number;
  kind: "start" | "adjust" | "end";
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
  gauges: CompanyPdfGauge[];
  highlights: string[];
  bridge: CompanyPdfBridgeRow[];
  marginPct: number | null;
  priceLow: string | null;
  priceHigh: string | null;
  asking: string;
  priceLowCents: number | null;
  priceHighCents: number | null;
  askingCents: number;
  sectorLabel: string | null;
  multipleLow: string | null;
  multipleHigh: string | null;
  generatedLabel: string;
  watermark: string | null;
};

type Fonts = {
  sans: PDFFont;
  sansSemi: PDFFont;
  heading: PDFFont;
  headingSemi: PDFFont;
};

const ink = rgb(18 / 255, 52 / 255, 58 / 255);
const clay = rgb(15 / 255, 110 / 255, 115 / 255);
const moss = rgb(12 / 255, 62 / 255, 68 / 255);
const navy = rgb(28 / 255, 39 / 255, 64 / 255);
const teal = rgb(47 / 255, 168 / 255, 156 / 255);
const muted = rgb(92 / 255, 107 / 255, 120 / 255);
const paper = rgb(229 / 255, 238 / 255, 240 / 255);
const sand = rgb(244 / 255, 248 / 255, 248 / 255);
const white = rgb(1, 1, 1);
const line = rgb(221 / 255, 231 / 255, 234 / 255);
const mist = rgb(232 / 255, 246 / 255, 244 / 255);
const ice = rgb(236 / 255, 247 / 255, 246 / 255);
const amber = rgb(196 / 255, 92 / 255, 43 / 255);
const gold = rgb(212 / 255, 160 / 255, 64 / 255);
const rose = rgb(196 / 255, 72 / 255, 86 / 255);
const kpiTints = [ice, mist, sand, mixRgb(ice, clay, 0.08)];
const kpiAccents = [clay, teal, moss, clay];
const barRevenue = clay;
const barEbitda = teal;
const barEbit = moss;
const barNet = rgb(15 / 255, 110 / 255, 115 / 255);
const priceRed = rgb(217 / 255, 45 / 255, 32 / 255);
const priceAmber = rgb(247 / 255, 144 / 255, 9 / 255);
const priceGold = rgb(253 / 255, 176 / 255, 34 / 255);
const priceGreen = rgb(18 / 255, 183 / 255, 106 / 255);
const priceMarker = rgb(16 / 255, 24 / 255, 40 / 255);
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 36;
const FOOTER = 38;
const CONTENT_W = PAGE_W - M * 2;

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
  return value.replaceAll("’", "'").replaceAll("“", '"').replaceAll("”", '"');
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

function drawRight(
  page: PDFPage,
  font: PDFFont,
  text: string,
  right: number,
  y: number,
  size: number,
  color: RGB,
) {
  const safe = pdfSafe(text);
  drawText(page, font, safe, right - font.widthOfTextAtSize(safe, size), y, size, color);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  const n = Math.min(1, Math.max(0, t));
  return rgb(a.red + (b.red - a.red) * n, a.green + (b.green - a.green) * n, a.blue + (b.blue - a.blue) * n);
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return mix(a, b, t);
}

function fillBar(page: PDFPage, x: number, y: number, width: number, height: number, color: RGB) {
  if (width <= 0 || height <= 0) {
    return;
  }
  const steps = 6;
  const slice = height / steps;
  for (let i = 0; i < steps; i += 1) {
    page.drawRectangle({
      x,
      y: y + i * slice,
      width,
      height: slice + 0.35,
      color: mix(color, white, (i / Math.max(1, steps - 1)) * 0.18),
    });
  }
}

function card(page: PDFPage, x: number, y: number, w: number, h: number, fill: RGB = sand, accent: RGB = clay) {
  page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: line, borderWidth: 0.7 });
  page.drawRectangle({ x, y, width: 5, height: h, color: accent });
}

/** pdf-lib SVG paths are y-down around options.x/y, so keep the fan relative to the donut center. */
function slicePath(radius: number, start: number, end: number): string {
  const sweep = end - start;
  const steps = Math.max(8, Math.ceil(Math.abs(sweep) / 0.08));
  const parts = ["M 0 0"];
  for (let i = 0; i <= steps; i += 1) {
    const angle = start + (sweep * i) / steps;
    const px = radius * Math.cos(angle);
    const py = -radius * Math.sin(angle);
    parts.push(`L ${px.toFixed(2)} ${py.toFixed(2)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

function drawDonut(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  slices: Array<{ label: string; value: number; color: RGB }>,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  card(page, x, y, width, height, white, teal);
  drawText(page, fonts.headingSemi, title, x + 14, y + height - 22, 10, ink);
  const usable = slices.filter((slice) => slice.value > 0);
  const total = usable.reduce((sum, slice) => sum + slice.value, 0);
  const legendH = 12 + usable.length * 16;
  const cx = x + width / 2;
  const cy = y + legendH + (height - 28 - legendH) / 2;
  const radius = Math.min(48, width * 0.28, Math.max(22, (height - 36 - legendH) * 0.42));
  if (total <= 0 || usable.length === 0) {
    drawText(page, fonts.sans, "Sin mix publicado.", x + 14, y + height / 2, 8, muted);
    return;
  }
  let angle = Math.PI / 2;
  for (const slice of usable) {
    const next = angle - (slice.value / total) * Math.PI * 2;
    page.drawSvgPath(slicePath(radius, angle, next), { x: cx, y: cy, color: slice.color });
    angle = next;
  }
  page.drawCircle({ x: cx, y: cy, size: radius * 0.55, color: white });
  let legendY = y + 12 + (usable.length - 1) * 16;
  for (const slice of usable) {
    page.drawRectangle({ x: x + 14, y: legendY, width: 8, height: 8, color: slice.color });
    const pct = `${Math.round((slice.value / total) * 100)} %`;
    drawText(page, fonts.sansSemi, slice.label, x + 26, legendY, 7.5, ink);
    drawRight(page, fonts.sans, pct, x + width - 14, legendY, 7, muted);
    legendY -= 16;
  }
}

function drawBrandLogo(page: PDFPage, logo: PDFImage, x: number, y: number, height: number): number {
  const width = (brandLogoSize.width / brandLogoSize.height) * height;
  page.drawImage(logo, { x, y, width, height });
  return width;
}

function drawFooter(page: PDFPage, fonts: Fonts, pageIndex: number, total: number) {
  page.drawRectangle({ x: M, y: FOOTER - 10, width: CONTENT_W, height: 0.6, color: line });
  drawText(page, fonts.sans, `${companyPdfCopy.brand}  ·  ${companyPdfCopy.site}`, M, 16, 8, muted);
  const label = `${pageIndex + 1} / ${total}`;
  drawRight(page, fonts.sansSemi, label, PAGE_W - M, 16, 8, muted);
}

function drawWatermark(page: PDFPage, fonts: Fonts, text: string) {
  page.drawText(pdfSafe(text), {
    x: 64,
    y: PAGE_H / 2 - 18,
    size: 13,
    font: fonts.heading,
    color: rgb(15 / 255, 110 / 255, 115 / 255),
    rotate: degrees(28),
    opacity: 0.09,
  });
}

function drawLetterhead(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  page.drawRectangle({ x: 0, y: PAGE_H - 52, width: PAGE_W, height: 52, color: ice });
  page.drawRectangle({ x: 0, y: PAGE_H - 52, width: PAGE_W, height: 4, color: clay });
  const logoH = 22;
  drawBrandLogo(page, logo, M, PAGE_H - 40, logoH);
  const kicker = `${companyPdfCopy.confidential}  ·  ${view.kind === "teaser" ? companyPdfCopy.teaserTitle : companyPdfCopy.dossierTitle}`;
  drawRight(page, fonts.sansSemi, kicker.toUpperCase(), PAGE_W - M, PAGE_H - 32, 8, clay);
}

function drawHero(page: PDFPage, fonts: Fonts, view: CompanyPdfView, y: number, height: number) {
  page.drawRectangle({ x: 0, y, width: PAGE_W, height, color: moss });
  page.drawRectangle({ x: 0, y: y + height * 0.55, width: PAGE_W, height: height * 0.45, color: mix(moss, clay, 0.35) });
  page.drawRectangle({ x: 0, y, width: 8, height, color: gold });
  page.drawRectangle({ x: 0, y, width: PAGE_W, height: 3, color: clay });
  const title = view.kind === "teaser" ? companyPdfCopy.teaserTitle : companyPdfCopy.dossierTitle;
  drawText(page, fonts.sansSemi, title.toUpperCase(), M, y + height - 22, 9, rgb(0.78, 0.9, 0.88));
  drawText(page, fonts.headingSemi, view.codename, M, y + height - 50, 22, white);
  const chips = [view.region, view.cnae, view.decade, view.headcount].filter((item): item is string => Boolean(item));
  let chipX = M;
  const chipY = y + 16;
  chips.slice(0, 4).forEach((chip) => {
    const label = pdfSafe(chip);
    const chipWidth = Math.min(210, fonts.sans.widthOfTextAtSize(label, 8) + 16);
    page.drawRectangle({ x: chipX, y: chipY, width: chipWidth, height: 16, color: white });
    drawText(page, fonts.sans, chip, chipX + 8, chipY + 4, 8, ink);
    chipX += chipWidth + 6;
  });
}

function coverKpis(view: CompanyPdfView): CompanyPdfKpi[] {
  const extra =
    view.marginPct === null ? [] : [{ label: "Margen EBITDA", value: `${Math.round(view.marginPct)} %` }];
  return [...view.kpis, ...extra].slice(0, 4);
}

const kpiIcons: LucidePdfIcon[] = ["chartColumn", "trendingUp", "banknote", "percent"];

function drawKpiIcon(page: PDFPage, kind: number, x: number, y: number, color: RGB) {
  drawLucideIcon(page, kpiIcons[kind] ?? "chartColumn", x, y, 13, color);
}

function drawKpiGrid(page: PDFPage, fonts: Fonts, kpis: CompanyPdfKpi[], x: number, y: number, width: number, height: number) {
  const gap = 8;
  const cols = Math.min(4, Math.max(1, kpis.length));
  const boxWidth = (width - gap * (cols - 1)) / cols;
  kpis.forEach((kpi, index) => {
    const left = x + index * (boxWidth + gap);
    const accent = kpiAccents[index] ?? clay;
    const tint = kpiTints[index] ?? ice;
    page.drawRectangle({
      x: left,
      y,
      width: boxWidth,
      height,
      color: tint,
      borderColor: mix(accent, white, 0.55),
      borderWidth: 0.8,
    });
    page.drawRectangle({ x: left, y, width: 6, height, color: accent });
    drawKpiIcon(page, index, left + boxWidth - 26, y + height - 22, accent);
    drawText(page, fonts.sans, kpi.label, left + 14, y + height - 22, 8, muted);
    drawText(page, fonts.headingSemi, kpi.value, left + 14, y + 14, 15, ink);
  });
}

function drawSectionBand(page: PDFPage, fonts: Fonts, title: string, subtitle?: string) {
  page.drawRectangle({ x: 0, y: PAGE_H - 96, width: PAGE_W, height: 44, color: ice });
  page.drawRectangle({ x: 0, y: PAGE_H - 96, width: PAGE_W, height: 3, color: teal });
  page.drawRectangle({ x: 0, y: PAGE_H - 96, width: 8, height: 44, color: clay });
  drawText(page, fonts.headingSemi, title, M, PAGE_H - 72, 15, ink);
  if (subtitle) {
    drawText(page, fonts.sans, subtitle, M, PAGE_H - 86, 8, muted);
  }
}

function centsPeak(years: CompanyPdfYear[], key: "revenueCents" | "ebitdaCents" | "ebitCents" | "netResultCents"): number {
  const values = years.map((row) => row[key]).filter((value): value is number => value !== null);
  const peak = Math.max(...values.map((value) => Math.abs(value)), 1);
  return peak;
}

function drawLabeledBars(
  page: PDFPage,
  fonts: Fonts,
  years: CompanyPdfYear[],
  key: "revenueCents" | "ebitdaCents" | "ebitCents" | "netResultCents",
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGB,
) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, title, x + 14, y + height - 22, 10, ink);
  const chartX = x + 52;
  const chartY = y + 28;
  const chartW = width - 66;
  const chartH = height - 72;
  page.drawRectangle({ x: chartX, y: chartY, width: chartW, height: chartH, color: mist });
  const peak = centsPeak(years, key);
  const ticks = [0, 0.5, 1];
  ticks.forEach((share) => {
    const ty = chartY + share * chartH;
    page.drawRectangle({ x: chartX, y: ty, width: chartW, height: 0.4, color: line });
    const label = share === 0 ? "0" : formatCardEur(peak * share);
    drawRight(page, fonts.sans, label, chartX - 4, ty - 3, 6, muted);
  });
  if (years.length === 0) {
    drawText(page, fonts.sans, "Sin ejercicios cerrados", chartX + 8, chartY + chartH / 2, 8, muted);
    return;
  }
  const group = chartW / years.length;
  const bar = Math.min(28, group * 0.46);
  years.forEach((row, index) => {
    const value = row[key];
    const cx = chartX + index * group + group / 2;
    const amount = value ?? 0;
    const barH = Math.max(value === null ? 0 : 4, (Math.abs(amount) / peak) * (chartH - 16));
    const barY = amount >= 0 ? chartY : chartY - barH;
    if (value !== null) {
      fillBar(page, cx - bar / 2, barY, bar, barH, color);
      const label = formatCardEur(amount);
      const lw = fonts.sansSemi.widthOfTextAtSize(label, 6.5);
      drawText(page, fonts.sansSemi, label, cx - lw / 2, barY + barH + 3, 6.5, ink);
    }
    const yearLabel = String(row.year);
    const yw = fonts.sans.widthOfTextAtSize(yearLabel, 7);
    drawText(page, fonts.sans, yearLabel, cx - yw / 2, y + 12, 7, muted);
  });
}

function marginSeries(years: CompanyPdfYear[]): Array<{ year: number; pct: number | null }> {
  return years.map((row) => {
    const bp =
      row.revenueCents === null || row.ebitdaCents === null
        ? null
        : ebitdaMarginBasisPoints(row.ebitdaCents, row.revenueCents);
    return { year: row.year, pct: bp === null ? null : bp / 100 };
  });
}

function drawMarginChart(
  page: PDFPage,
  fonts: Fonts,
  years: CompanyPdfYear[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, "Evolución del margen EBITDA", x + 14, y + height - 22, 10, ink);
  const series = marginSeries(years);
  const chartX = x + 48;
  const chartY = y + 28;
  const chartW = width - 62;
  const chartH = height - 58;
  page.drawRectangle({ x: chartX, y: chartY, width: chartW, height: chartH, color: mist });
  const peak = Math.max(...series.map((row) => row.pct ?? 0), 10);
  [0, 0.5, 1].forEach((share) => {
    const ty = chartY + share * chartH;
    page.drawRectangle({ x: chartX, y: ty, width: chartW, height: 0.4, color: line });
    drawRight(page, fonts.sans, `${Math.round(peak * share)} %`, chartX - 4, ty - 3, 6, muted);
  });
  if (series.length === 0) {
    drawText(page, fonts.sans, "Sin series de margen", chartX + 8, chartY + chartH / 2, 8, muted);
    return;
  }
  const step = series.length === 1 ? 0 : chartW / (series.length - 1);
  series.forEach((row, index) => {
    const px = chartX + (series.length === 1 ? chartW / 2 : index * step);
    if (row.pct !== null) {
      const py = chartY + (row.pct / peak) * (chartH - 8);
      page.drawCircle({ x: px, y: py, size: 3.2, color: clay });
      if (index > 0) {
        const label = `${Math.round(row.pct)} %`;
        const lw = fonts.sansSemi.widthOfTextAtSize(label, 7);
        const labelX = Math.min(chartX + chartW - lw, Math.max(chartX, px + 6));
        drawText(page, fonts.sansSemi, label, labelX, py + 5, 7, ink);
      }
      const next = series[index + 1];
      if (next && next.pct !== null) {
        const nx = chartX + (index + 1) * step;
        const ny = chartY + (next.pct / peak) * (chartH - 8);
        page.drawLine({ start: { x: px, y: py }, end: { x: nx, y: ny }, thickness: 1.6, color: clay });
      }
    }
    const yearLabel = String(row.year);
    const yw = fonts.sans.widthOfTextAtSize(yearLabel, 7);
    drawText(page, fonts.sans, yearLabel, px - yw / 2, y + 12, 7, muted);
  });
}

function drawPriceRange(page: PDFPage, fonts: Fonts, view: CompanyPdfView, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: mist, borderColor: line, borderWidth: 0.7 });
  page.drawRectangle({ x, y, width: 4, height, color: clay });
  drawText(page, fonts.headingSemi, companyPdfCopy.priceTitle, x + 14, y + height - 22, 11, ink);
  const sector =
    view.sectorLabel && view.multipleLow && view.multipleHigh
      ? `${companyPdfCopy.priceCaption} Sector ${view.sectorLabel}: ${view.multipleLow}–${view.multipleHigh}.`
      : companyPdfCopy.priceCaption;
  let captionY = y + height - 38;
  for (const row of wrap(fonts.sans, sector, 8, width - 28).slice(0, 2)) {
    drawText(page, fonts.sans, row, x + 14, captionY, 8, muted);
    captionY -= 11;
  }
  const trackX = x + 18;
  const trackY = y + 38;
  const trackW = width - 36;
  const trackH = 9;
  drawPriceBarTrack(page, trackX, trackY, trackW, trackH);
  const zoneX = trackX + priceBarZone.low * trackW;
  const zoneW = (priceBarZone.high - priceBarZone.low) * trackW;
  const lowLabel = view.priceLow ?? "—";
  const highLabel = view.priceHigh ?? "—";
  drawText(page, fonts.sansSemi, lowLabel, zoneX, trackY - 14, 8, ink);
  drawRight(page, fonts.sansSemi, highLabel, zoneX + zoneW, trackY - 14, 8, ink);
  if (view.priceLowCents !== null && view.priceHighCents !== null) {
    const ends = priceBarEnds({ lowCents: view.priceLowCents, highCents: view.priceHighCents });
    drawText(page, fonts.sans, formatCardEur(ends.minCents), trackX, trackY + 14, 7, muted);
    drawRight(page, fonts.sans, formatCardEur(ends.maxCents), trackX + trackW, trackY + 14, 7, muted);
    const pos = priceBarPosition(view.askingCents, { lowCents: view.priceLowCents, highCents: view.priceHighCents });
    const dotX = trackX + pos * trackW;
    page.drawCircle({ x: dotX, y: trackY + trackH / 2, size: 6.2, color: white });
    page.drawCircle({ x: dotX, y: trackY + trackH / 2, size: 4.4, color: priceMarker, borderColor: white, borderWidth: 1.2 });
    const ask = `Precio pedido ${view.asking}`;
    const askW = fonts.sansSemi.widthOfTextAtSize(ask, 8);
    const askX = Math.min(trackX + trackW - askW, Math.max(trackX, dotX - askW / 2));
    drawText(page, fonts.sansSemi, ask, askX, y + 12, 8, ink);
  } else {
    drawText(page, fonts.sansSemi, `Precio pedido ${view.asking}`, trackX, y + 12, 8, ink);
  }
}

/** Same red → amber → green scale as the ficha asking-price bar. */
function drawPriceBarTrack(page: PDFPage, x: number, y: number, width: number, height: number) {
  const stops: Array<{ t: number; color: RGB }> = [
    { t: 0, color: priceRed },
    { t: priceBarZone.low * 0.45, color: priceAmber },
    { t: priceBarZone.low * 0.85, color: priceGold },
    { t: priceBarZone.low, color: priceGreen },
    { t: priceBarZone.high, color: priceGreen },
    { t: priceBarZone.high + (1 - priceBarZone.high) * 0.15, color: priceGold },
    { t: priceBarZone.high + (1 - priceBarZone.high) * 0.55, color: priceAmber },
    { t: 1, color: priceRed },
  ];
  const slices = 48;
  for (let i = 0; i < slices; i += 1) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    page.drawRectangle({
      x: x + t0 * width,
      y,
      width: (t1 - t0) * width + 0.2,
      height,
      color: samplePriceStop(stops, (t0 + t1) / 2),
    });
  }
}

function samplePriceStop(stops: Array<{ t: number; color: RGB }>, t: number): RGB {
  const clamped = Math.min(1, Math.max(0, t));
  let left = stops[0];
  let right = stops[stops.length - 1];
  if (!left || !right) {
    return priceGreen;
  }
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (a && b && clamped >= a.t && clamped <= b.t) {
      left = a;
      right = b;
      break;
    }
  }
  const span = right.t - left.t;
  return mix(left.color, right.color, span <= 0 ? 0 : (clamped - left.t) / span);
}

function drawBulletCard(
  page: PDFPage,
  fonts: Fonts,
  title: string,
  items: string[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, title, x + 14, y + height - 22, 11, ink);
  let rowY = y + height - 42;
  const inner = width - 32;
  const empty = items.length === 0 ? ["Sin dato publicado."] : items;
  for (const item of empty) {
    if (rowY < y + 18) {
      break;
    }
    page.drawCircle({ x: x + 18, y: rowY + 3, size: 2.1, color: clay });
    const lines = wrap(fonts.sans, item, 9, inner - 12).slice(0, 3);
    for (const line of lines) {
      if (rowY < y + 16) {
        break;
      }
      drawText(page, fonts.sans, line, x + 26, rowY, 9, ink);
      rowY -= 12;
    }
    rowY -= 6;
  }
}

function uniqueLines(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().replace(/[.!?]+$/g, "").toLowerCase();
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function drawDealCard(page: PDFPage, fonts: Fonts, view: CompanyPdfView, x: number, y: number, width: number, height: number) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, companyPdfCopy.dealTitle, x + 14, y + height - 22, 11, ink);
  const rows = [
    { label: companyPdfCopy.motivoTitle, value: view.saleReason ?? "—" },
    { label: "Financiación vendedor", value: view.financing ?? "—" },
    { label: "Permanencia", value: view.stay ?? "—" },
  ];
  let rowY = y + height - 44;
  for (const row of rows) {
    drawText(page, fonts.sans, row.label.toUpperCase(), x + 14, rowY, 7, muted);
    rowY -= 14;
    const lines = wrap(fonts.sansSemi, row.value, 10, width - 28).slice(0, 3);
    for (const line of lines) {
      drawText(page, fonts.sansSemi, line, x + 14, rowY, 10, ink);
      rowY -= 13;
    }
    rowY -= 10;
  }
  const noteLines = wrap(
    fonts.sans,
    "Términos indicativos de la ficha. El NDA en Relify abre el cuaderno y el data room.",
    8,
    width - 48,
  ).slice(0, 3);
  const noteH = 16 + noteLines.length * 11;
  page.drawRectangle({ x: x + 12, y: y + 12, width: width - 24, height: noteH, color: ice });
  page.drawRectangle({ x: x + 12, y: y + 12, width: 4, height: noteH, color: gold });
  let noteY = y + 12 + noteH - 14;
  for (const line of noteLines) {
    drawText(page, fonts.sans, line, x + 22, noteY, 8, muted);
    noteY -= 11;
  }
}

function drawCta(page: PDFPage, fonts: Fonts, title: string, body: string, x: number, y: number, width: number, height: number) {
  page.drawRectangle({ x, y, width, height, color: moss });
  page.drawRectangle({ x, y: y + height - 6, width, height: 6, color: mix(clay, teal, 0.4) });
  page.drawRectangle({ x, y, width: 7, height, color: gold });
  drawText(page, fonts.headingSemi, title, x + 18, y + height - 24, 12, white);
  let bodyY = y + height - 42;
  for (const row of wrap(fonts.sans, body, 9, width - 36).slice(0, 3)) {
    drawText(page, fonts.sans, row, x + 18, bodyY, 9, rgb(0.82, 0.93, 0.91));
    bodyY -= 12;
  }
}

function drawYearTable(
  page: PDFPage,
  fonts: Fonts,
  years: CompanyPdfYear[],
  x: number,
  y: number,
  width: number,
  height: number,
  full: boolean,
) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, "Ejercicios cerrados", x + 14, y + height - 22, 10, ink);
  const headers = full
    ? ["Año", "Facturación", "EBITDA", "EBIT", "Resultado", "Plantilla"]
    : ["Año", "Facturación", "EBITDA", "Plantilla"];
  const cols = full ? [48, 110, 100, 90, 110, 70] : [70, 150, 140, 90];
  let headerX = x + 14;
  headers.forEach((header, index) => {
    drawText(page, fonts.sansSemi, header, headerX, y + height - 40, 8, muted);
    headerX += cols[index] ?? 80;
  });
  page.drawRectangle({ x: x + 12, y: y + height - 48, width: width - 24, height: 0.6, color: line });
  let rowY = y + height - 64;
  for (const year of years) {
    if (rowY < y + 10) {
      break;
    }
    const values = full
      ? [
          String(year.year),
          year.revenueCents === null ? "—" : formatCardEur(year.revenueCents),
          year.ebitdaCents === null ? "—" : formatCardEur(year.ebitdaCents),
          year.ebitCents === null ? "—" : formatCardEur(year.ebitCents),
          year.netResultCents === null ? "—" : formatCardEur(year.netResultCents),
          year.employees === null ? "—" : String(year.employees),
        ]
      : [
          String(year.year),
          year.revenueCents === null ? "—" : formatCardEur(year.revenueCents),
          year.ebitdaCents === null ? "—" : formatCardEur(year.ebitdaCents),
          year.employees === null ? "—" : String(year.employees),
        ];
    let cellX = x + 14;
    values.forEach((value, index) => {
      drawText(page, fonts.sans, value, cellX, rowY, 9, ink);
      cellX += cols[index] ?? 80;
    });
    rowY -= 16;
  }
}

function drawGauges(page: PDFPage, fonts: Fonts, gauges: CompanyPdfGauge[], x: number, y: number, width: number, height: number) {
  const gap = 8;
  const cols = 3;
  const rows = Math.max(1, Math.ceil(gauges.length / cols));
  const boxW = (width - gap * (cols - 1)) / cols;
  const boxH = (height - gap * (rows - 1)) / rows;
  gauges.forEach((gauge, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const gx = x + col * (boxW + gap);
    const gy = y + height - (row + 1) * boxH - row * gap;
    const accent = kpiAccents[index % kpiAccents.length] ?? clay;
    card(page, gx, gy, boxW, boxH, white, accent);
    page.drawRectangle({ x: gx + 5, y: gy + boxH - 22, width: boxW - 5, height: 22, color: mix(accent, white, 0.88) });
    drawText(page, fonts.sans, gauge.label, gx + 12, gy + boxH - 16, 8, ink);
    drawText(page, fonts.headingSemi, gauge.value, gx + 12, gy + boxH - 44, 14, ink);
    const trackX = gx + 12;
    const trackY = gy + 28;
    const trackW = boxW - 24;
    page.drawRectangle({ x: trackX, y: trackY, width: trackW, height: 9, color: paper });
    fillBar(page, trackX, trackY, Math.max(6, Math.min(1, Math.max(0, gauge.fill)) * trackW), 9, accent);
    const hint = wrap(fonts.sans, gauge.hint, 7, trackW).slice(0, 2);
    let hintY = gy + 14;
    for (const line of hint) {
      drawText(page, fonts.sans, line, gx + 12, hintY, 7, muted);
      hintY -= 9;
    }
  });
}

function drawBridge(page: PDFPage, fonts: Fonts, rows: CompanyPdfBridgeRow[], x: number, y: number, width: number, height: number) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, "Puente de EBITDA", x + 14, y + height - 22, 11, ink);
  drawText(page, fonts.sans, "Declarado → ajustes aprobados → ajustado", x + 14, y + height - 36, 8, muted);
  if (rows.length === 0) {
    drawText(page, fonts.sans, "Sin ajustes publicados.", x + 14, y + height / 2, 9, muted);
    return;
  }
  const chartX = x + 16;
  const chartY = y + 28;
  const chartW = width - 32;
  const chartH = height - 70;
  const peak = Math.max(...rows.map((row) => Math.abs(row.cents)), 1);
  const group = chartW / rows.length;
  const bar = Math.min(36, group * 0.42);
  rows.forEach((row, index) => {
    const cx = chartX + index * group + group / 2;
    const barH = Math.max(8, (Math.abs(row.cents) / peak) * (chartH - 24));
    const color = row.kind === "adjust" ? (row.cents >= 0 ? teal : rose) : row.kind === "end" ? clay : navy;
    fillBar(page, cx - bar / 2, chartY, bar, barH, color);
    const amount = `${row.cents >= 0 && row.kind === "adjust" ? "+" : ""}${formatCardEur(row.cents)}`;
    const aw = fonts.sansSemi.widthOfTextAtSize(amount, 7);
    drawText(page, fonts.sansSemi, amount, cx - aw / 2, chartY + barH + 4, 7, ink);
    const labels = wrap(fonts.sans, row.label, 7, group - 6).slice(0, 2);
    let ly = y + 16;
    for (const label of labels) {
      const lw = fonts.sans.widthOfTextAtSize(label, 7);
      drawText(page, fonts.sans, label, cx - lw / 2, ly, 7, muted);
      ly -= 9;
    }
  });
}

function drawValuationCard(page: PDFPage, fonts: Fonts, view: CompanyPdfView, x: number, y: number, width: number, height: number) {
  card(page, x, y, width, height, white);
  drawText(page, fonts.headingSemi, "Valoración orientativa", x + 14, y + height - 22, 11, ink);
  const lines = [
    `Rango: ${view.priceLow ?? "—"} – ${view.priceHigh ?? "—"}`,
    `Precio pedido: ${view.asking}`,
    view.sectorLabel && view.multipleLow && view.multipleHigh
      ? `Múltiplo ${view.sectorLabel}: ${view.multipleLow}–${view.multipleHigh} × EBITDA aj.`
      : "Múltiplo sectorial no disponible para este CNAE.",
    companyPdfCopy.priceCaption,
  ];
  let rowY = y + height - 44;
  for (const line of lines) {
    for (const wrapped of wrap(fonts.sans, line, 9, width - 28).slice(0, 2)) {
      drawText(page, fonts.sans, wrapped, x + 14, rowY, 9, ink);
      rowY -= 13;
    }
    rowY -= 4;
  }
}

function summaryText(view: CompanyPdfView): string {
  return view.summary ?? "Sin descripción publicada.";
}

function lastYearMix(view: CompanyPdfView): Array<{ label: string; value: number; color: RGB }> {
  const last = view.years[view.years.length - 1];
  const revenue = Math.max(0, last?.revenueCents ?? 0);
  const ebitda = last?.ebitdaCents;
  const ebit = last?.ebitCents;
  const net = last?.netResultCents;
  if (revenue <= 0) {
    return [];
  }
  const operatingCosts = ebitda === null ? 0 : Math.max(0, revenue - Math.max(0, ebitda));
  const da = ebitda === null || ebit === null ? 0 : Math.max(0, ebitda - ebit);
  const belowEbit = ebit === null || net === null ? 0 : Math.max(0, ebit - net);
  const profit = Math.max(0, net ?? ebit ?? ebitda ?? 0);
  return [
    { label: "Resultado neto", value: profit, color: clay },
    { label: "Financiero e impuesto", value: belowEbit, color: gold },
    { label: "Amortización", value: da, color: amber },
    { label: "Costes operativos", value: operatingCosts, color: navy },
  ].filter((slice) => slice.value > 0);
}

function drawTeaserCover(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  const heroH = 108;
  const heroY = PAGE_H - 48 - heroH;
  drawHero(page, fonts, view, heroY, heroH);
  const kpiH = 68;
  const kpiY = heroY - 14 - kpiH;
  drawKpiGrid(page, fonts, coverKpis(view), M, kpiY, CONTENT_W, kpiH);
  const priceH = 108;
  const priceY = kpiY - 12 - priceH;
  drawPriceRange(page, fonts, view, M, priceY, CONTENT_W, priceH);
  const ctaH = 68;
  const ctaY = FOOTER + 8;
  const midY = ctaY + ctaH + 10;
  const midH = priceY - 12 - midY;
  const colGap = 10;
  const colW = (CONTENT_W - colGap) / 2;
  drawBulletCard(page, fonts, companyPdfCopy.thesisTitle, view.highlights, M, midY, colW, midH);
  drawDealCard(page, fonts, view, M + colW + colGap, midY, colW, midH);
  drawCta(page, fonts, companyPdfCopy.teaserCtaTitle, companyPdfCopy.teaserCtaBody, M, ctaY, CONTENT_W, ctaH);
}

function drawTeaserFigures(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  drawSectionBand(page, fonts, "Evolución de cifras", "Facturación y EBITDA de los ejercicios cerrados. Ejes e importes en EUR.");
  const ctaH = 64;
  const ctaY = FOOTER + 8;
  const top = PAGE_H - 96;
  const usable = top - (ctaY + ctaH + 10);
  const gap = 8;
  const tableH = Math.min(148, Math.max(128, 60 + view.years.length * 16));
  const bulletsH = 96;
  const chartsBlock = usable - tableH - bulletsH - gap * 2;
  const chartH = chartsBlock * 0.58;
  const marginH = chartsBlock - chartH - gap;
  const colW = (CONTENT_W - gap) / 2;
  const chartY = top - chartH;
  drawLabeledBars(page, fonts, view.years, "revenueCents", "Facturación", M, chartY, colW, chartH, barRevenue);
  drawLabeledBars(page, fonts, view.years, "ebitdaCents", "EBITDA", M + colW + gap, chartY, colW, chartH, barEbitda);
  const marginY = chartY - gap - marginH;
  const mixW = Math.min(236, CONTENT_W * 0.42);
  drawMarginChart(page, fonts, view.years, M, marginY, CONTENT_W - mixW - gap, marginH);
  drawDonut(page, fonts, "Mix de la cifra", lastYearMix(view), M + CONTENT_W - mixW, marginY, mixW, marginH);
  const tableY = marginY - gap - tableH;
  drawYearTable(page, fonts, view.years, M, tableY, CONTENT_W, tableH, false);
  drawBulletCard(page, fonts, companyPdfCopy.highlightsTitle, view.highlights, M, ctaY + ctaH + 10, CONTENT_W, bulletsH);
  drawCta(page, fonts, companyPdfCopy.teaserCtaTitle, companyPdfCopy.teaserCtaBody, M, ctaY, CONTENT_W, ctaH);
}

function drawDossierCover(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  const heroH = 118;
  const heroY = PAGE_H - 48 - heroH;
  drawHero(page, fonts, view, heroY, heroH);
  const kpiH = 68;
  const kpiY = heroY - 14 - kpiH;
  drawKpiGrid(page, fonts, coverKpis(view), M, kpiY, CONTENT_W, kpiH);
  const noteH = 48;
  const noteY = FOOTER + 8;
  card(page, M, noteY, CONTENT_W, noteH, sand);
  let ny = noteY + noteH - 18;
  for (const row of wrap(fonts.sans, companyPdfCopy.dossierNote, 8, CONTENT_W - 28).slice(0, 3)) {
    drawText(page, fonts.sans, row, M + 14, ny, 8, muted);
    ny -= 11;
  }
  const midY = noteY + noteH + 10;
  const midH = kpiY - 12 - midY;
  const priceH = Math.min(120, midH * 0.42);
  const priceY = kpiY - 12 - priceH;
  drawPriceRange(page, fonts, view, M, priceY, CONTENT_W, priceH);
  const colY = midY;
  const colH = priceY - 10 - colY;
  const colW = (CONTENT_W - 10) / 2;
  drawBulletCard(page, fonts, "Resumen ejecutivo", uniqueLines([summaryText(view), ...view.highlights]).slice(0, 5), M, colY, colW, colH);
  drawDealCard(page, fonts, view, M + colW + 10, colY, colW, colH);
}

function drawDossierSummary(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  drawSectionBand(page, fonts, "Resumen ejecutivo");
  const ctaH = 62;
  const ctaY = FOOTER + 8;
  const top = PAGE_H - 108;
  const priceH = 112;
  const kpiH = 68;
  const gap = 10;
  const restY = ctaY + ctaH + gap;
  const thesisH = top - (restY + kpiH + gap + priceH + gap);
  const colW = (CONTENT_W - 10) / 2;
  drawBulletCard(page, fonts, companyPdfCopy.thesisTitle, view.highlights, M, top - thesisH, colW, thesisH);
  drawDealCard(page, fonts, view, M + colW + 10, top - thesisH, colW, thesisH);
  const priceY = restY + kpiH + gap;
  drawPriceRange(page, fonts, view, M, priceY, CONTENT_W, priceH);
  drawKpiGrid(page, fonts, coverKpis(view), M, restY, CONTENT_W, kpiH);
  drawCta(page, fonts, companyPdfCopy.dossierCtaTitle, companyPdfCopy.dossierCtaBody, M, ctaY, CONTENT_W, ctaH);
}

function drawDossierPnl(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  drawSectionBand(page, fonts, "Cuenta de resultados", "Evolución P&L con ejes y valores. Importes en EUR.");
  const top = PAGE_H - 96;
  const bottom = FOOTER + 8;
  const usable = top - bottom;
  const chartH = usable * 0.36;
  const gap = 8;
  const colW = (CONTENT_W - gap) / 2;
  drawLabeledBars(page, fonts, view.years, "revenueCents", "Facturación", M, top - chartH, colW, chartH, barRevenue);
  drawLabeledBars(page, fonts, view.years, "ebitdaCents", "EBITDA", M + colW + gap, top - chartH, colW, chartH, barEbitda);
  const row2Y = top - chartH - gap - chartH;
  drawLabeledBars(page, fonts, view.years, "ebitCents", "EBIT", M, row2Y, colW, chartH, barEbit);
  drawLabeledBars(page, fonts, view.years, "netResultCents", "Resultado neto", M + colW + gap, row2Y, colW, chartH, barNet);
  const tableH = row2Y - gap - bottom;
  drawYearTable(page, fonts, view.years, M, bottom, CONTENT_W, tableH, true);
}

function drawDossierOps(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  drawSectionBand(
    page,
    fonts,
    "Márgenes y ratios operativos",
    "Deuda neta, NOF, conversión a caja, capex, plantilla y plazos. Solo en el cuaderno post-NDA.",
  );
  const top = PAGE_H - 96;
  const bottom = FOOTER + 8;
  const marginH = (top - bottom) * 0.3;
  const mixW = Math.min(220, CONTENT_W * 0.36);
  drawMarginChart(page, fonts, view.years, M, top - marginH, CONTENT_W - mixW - 8, marginH);
  drawDonut(page, fonts, "Mix de la cifra", lastYearMix(view), M + CONTENT_W - mixW, top - marginH, mixW, marginH);
  const gaugesH = top - marginH - 10 - bottom;
  drawGauges(page, fonts, view.gauges, M, bottom, CONTENT_W, gaugesH);
}

function drawDossierDeal(page: PDFPage, fonts: Fonts, logo: PDFImage, view: CompanyPdfView) {
  drawLetterhead(page, fonts, logo, view);
  drawSectionBand(page, fonts, "Ajustes, valoración y operación");
  const ctaH = 62;
  const ctaY = FOOTER + 8;
  const top = PAGE_H - 108;
  const usable = top - (ctaY + ctaH + 10);
  const bridgeH = usable * 0.42;
  drawBridge(page, fonts, view.bridge, M, top - bridgeH, CONTENT_W, bridgeH);
  const restH = top - bridgeH - 10 - (ctaY + ctaH + 10);
  const colW = (CONTENT_W - 10) / 2;
  const colY = ctaY + ctaH + 10;
  const valH = Math.min(150, restH * 0.48);
  drawValuationCard(page, fonts, view, M, colY + restH - valH, colW, valH);
  drawPriceRange(page, fonts, view, M, colY, colW, restH - valH - 8);
  drawDealCard(page, fonts, view, M + colW + 10, colY, colW, restH);
  drawCta(page, fonts, companyPdfCopy.dossierCtaTitle, companyPdfCopy.dossierCtaBody, M, ctaY, CONTENT_W, ctaH);
}

export async function buildCompanyPdf(view: CompanyPdfView): Promise<Uint8Array<ArrayBuffer>> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(pdfFontkit());
  const [sans, sansSemi, heading, headingSemi, logo] = await Promise.all([
    doc.embedFont(dmSansRegular, { subset: true }),
    doc.embedFont(dmSansSemiBold, { subset: true }),
    doc.embedFont(geistRegular, { subset: true }),
    doc.embedFont(geistSemiBold, { subset: true }),
    doc.embedJpg(Uint8Array.from(Buffer.from(brandLogoJpegBase64, "base64"))),
  ]);
  const fonts: Fonts = { sans, sansSemi, heading, headingSemi };
  const pages: PDFPage[] = [];
  const addPage = () => {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: white });
    if (view.watermark) {
      drawWatermark(page, fonts, view.watermark);
    }
    pages.push(page);
    return page;
  };

  if (view.kind === "teaser") {
    drawTeaserCover(addPage(), fonts, logo, view);
    drawTeaserFigures(addPage(), fonts, logo, view);
  } else {
    drawDossierCover(addPage(), fonts, logo, view);
    drawDossierSummary(addPage(), fonts, logo, view);
    drawDossierPnl(addPage(), fonts, logo, view);
    drawDossierOps(addPage(), fonts, logo, view);
    drawDossierDeal(addPage(), fonts, logo, view);
  }
  pages.forEach((page, index) => {
    drawFooter(page, fonts, index, pages.length);
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
      ebitCents: year.ebitCents,
      netResultCents: year.netResultCents,
      employees: year.employees,
      collectionDays: collectionDaysOf(year),
      creditDays: creditDaysOf(year),
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
}): {
  low: string | null;
  high: string | null;
  asking: string;
  lowCents: number | null;
  highCents: number | null;
  askingCents: number;
  sectorLabel: string | null;
  multipleLow: string | null;
  multipleHigh: string | null;
} {
  const headline = reportHeadline({ ...input, ebitdaAdjustments: input.ebitdaAdjustments ?? null });
  const ebitda = headline.hasApprovedAdjustments ? headline.adjustedEbitdaCents : headline.ebitdaCents;
  const closed = [...(input.reportYears ?? [])].sort((left, right) => left.year - right.year);
  const last = closed[closed.length - 1];
  const previous = closed.length > 1 ? closed[closed.length - 2] : null;
  const revenueGrowth =
    last && previous && last.revenueCents !== null && previous.revenueCents !== null && previous.revenueCents > 0
      ? last.revenueCents / previous.revenueCents - 1
      : null;
  const ebitdaRows = closed.flatMap((year) =>
    year.ebitdaCents === null ? [] : [{ year: year.year, cents: year.ebitdaCents }],
  );
  const estimate = estimatePriceRange({
    cnae: input.cnaeCode ?? null,
    ebitdaCents: ebitda,
    headcount: input.headcount ?? undefined,
    revenueGrowth,
    ebitdaTrend: ebitdaTrend(ebitdaRows),
  });
  return {
    low: estimate ? formatCardEur(estimate.lowCents) : null,
    high: estimate ? formatCardEur(estimate.highCents) : null,
    asking: formatCardEur(input.askingPriceCents),
    lowCents: estimate?.lowCents ?? null,
    highCents: estimate?.highCents ?? null,
    askingCents: input.askingPriceCents,
    sectorLabel: estimate?.sectorLabel ?? null,
    multipleLow: estimate ? formatMultiple(estimate.multipleLow) : null,
    multipleHigh: estimate ? formatMultiple(estimate.multipleHigh) : null,
  };
}

function clampFill(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, value / max));
}

function dossierGauges(
  years: SabiYear[],
  input: { ebitdaCents: number; adjustedEbitdaCents: number; ebitdaAdjustments?: unknown },
): { ratios: CompanyPdfKpi[]; gauges: CompanyPdfGauge[] } {
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
  const ratios: CompanyPdfKpi[] = [
    { label: leverage.primaryLabel, value: leverageValue },
    { label: "NOF", value: nof === null ? "—" : formatCardEur(nof) },
    { label: "Conversión a caja", value: conversionValue },
    { label: "Capex / ventas", value: capex === null ? "—" : `${formatDecimal(capex, 1)} %` },
    { label: "Plantilla", value: last?.employees === null || last?.employees === undefined ? "—" : String(last.employees) },
    { label: "PMC (días)", value: pmc === null ? "—" : `${Math.round(pmc)} d` },
    { label: "PMP (días)", value: pmp === null ? "—" : `${Math.round(pmp)} d` },
    { label: "Deuda neta", value: net === null ? "—" : formatCardEur(net) },
  ];
  const gauges: CompanyPdfGauge[] = [
    {
      label: leverage.primaryLabel,
      value: leverageValue,
      fill: leverage.primaryTimes === null ? 0 : clampFill(leverage.primaryTimes, 5),
      hint: "Escala 0–5x DFN / EBITDA aj.",
    },
    {
      label: "NOF",
      value: nof === null ? "—" : formatCardEur(nof),
      fill: nof === null || last?.revenueCents === null || last.revenueCents <= 0 ? 0 : clampFill(Math.abs(nof), last.revenueCents),
      hint: "Necesidades operativas vs ventas",
    },
    {
      label: "Conversión a caja",
      value: conversionValue,
      fill: conversion === null || conversion.ratio === null ? 0 : clampFill(Math.max(0, conversion.ratio), 1),
      hint: "(EBITDA - var. NOF - capex) / EBITDA",
    },
    {
      label: "Capex / ventas",
      value: capex === null ? "—" : `${formatDecimal(capex, 1)} %`,
      fill: capex === null ? 0 : clampFill(capex, 20),
      hint: "Media 3 años. Escala 0–20 %",
    },
    {
      label: "Plantilla",
      value: last?.employees === null || last?.employees === undefined ? "—" : String(last.employees),
      fill: last?.employees ? clampFill(last.employees, 80) : 0,
      hint: "Personas en el último ejercicio",
    },
    {
      label: "PMC (días)",
      value: pmc === null ? "—" : `${Math.round(pmc)} d`,
      fill: pmc === null ? 0 : clampFill(pmc, 90),
      hint: "Plazo medio de cobro. Escala 0–90 d",
    },
    {
      label: "PMP (días)",
      value: pmp === null ? "—" : `${Math.round(pmp)} d`,
      fill: pmp === null ? 0 : clampFill(pmp, 90),
      hint: "Plazo medio de pago. Escala 0–90 d",
    },
    {
      label: "Deuda neta",
      value: net === null ? "—" : formatCardEur(net),
      fill: net === null || last?.revenueCents === null || last.revenueCents <= 0 ? 0 : clampFill(Math.abs(net), last.revenueCents),
      hint: "DFN frente a ventas del año",
    },
    {
      label: "Margen EBITDA",
      value: last === null || last.ebitdaCents === null || last.revenueCents === null
        ? "—"
        : `${Math.round((ebitdaMarginBasisPoints(last.ebitdaCents, last.revenueCents) ?? 0) / 100)} %`,
      fill:
        last === null || last.ebitdaCents === null || last.revenueCents === null
          ? 0
          : clampFill((ebitdaMarginBasisPoints(last.ebitdaCents, last.revenueCents) ?? 0) / 100, 40),
      hint: "EBITDA / ventas. Escala 0–40 %",
    },
  ];
  return { ratios, gauges };
}

function ebitdaBridge(input: {
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ebitdaAdjustments?: unknown;
  reportYears?: SabiYear[] | null;
  figuresVeiled?: boolean;
  revenueCents?: number;
}): CompanyPdfBridgeRow[] {
  const headline = reportHeadline({
    revenueCents: input.revenueCents ?? 0,
    ebitdaCents: input.ebitdaCents,
    adjustedEbitdaCents: input.adjustedEbitdaCents,
    ebitdaAdjustments: input.ebitdaAdjustments ?? null,
    reportYears: input.reportYears,
    figuresVeiled: input.figuresVeiled,
  });
  const rows = storedEbitdaAdjustments(input.ebitdaAdjustments ?? null);
  const approved = rows ? approvedAdjustments(rows) : [];
  const bridge: CompanyPdfBridgeRow[] = [{ label: "EBITDA declarado", cents: input.ebitdaCents, kind: "start" }];
  for (const row of approved) {
    bridge.push({ label: ebitdaAdjustmentLabels[row.type], cents: row.amountCents, kind: "adjust" });
  }
  bridge.push({
    label: "EBITDA ajustado",
    cents: headline.hasApprovedAdjustments ? headline.adjustedEbitdaCents : input.ebitdaCents,
    kind: "end",
  });
  return bridge;
}

function buildHighlights(input: {
  summary?: string | null;
  headcount?: HeadcountRangeId | null;
  reportYears?: SabiYear[] | null;
  revenueCents: number;
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  ebitdaAdjustments?: unknown;
  figuresVeiled?: boolean;
}): string[] {
  const items: string[] = [];
  const summary = input.summary?.trim();
  if (summary) {
    for (const part of summary.split(/[.!?]+\s+/)) {
      const clean = part.replace(/[.!?]+$/, "").trim();
      if (clean.length >= 20 && isCompanyThesisLine(clean)) {
        items.push(clean);
      }
    }
  }
  const years = yearsFromSabi(input.reportYears);
  const first = years[0];
  const last = years[years.length - 1];
  if (first && last && years.length >= 2 && first.revenueCents && last.revenueCents && first.revenueCents > 0) {
    const pct = Math.round(((last.revenueCents - first.revenueCents) / first.revenueCents) * 100);
    if (pct !== 0) {
      items.push(`Facturación ${pct > 0 ? "+" : ""}${pct} % entre ${first.year} y ${last.year}`);
    }
  }
  const margin = marginFromHeadline(input);
  if (margin !== null) {
    items.push(`Margen EBITDA del último ejercicio publicado: ${Math.round(margin)} %`);
  }
  if (input.headcount) {
    items.push(`Plantilla en banda ${headcountLabels[input.headcount]}`);
  }
  return items.slice(0, 5);
}

function isCompanyThesisLine(text: string): boolean {
  return !/ficha p[uú]blica|nombre de proyecto|sociedad no figura|plataforma/i.test(text);
}

function dealTerms(input: {
  saleReason?: string | null;
  sellerFinancing?: SellerFinancing | null;
  sellerStay?: SellerStay | null;
}): { saleReason: string | null; financing: string | null; stay: string | null } {
  return {
    saleReason: saleReasonLine(input.saleReason),
    financing: input.sellerFinancing ? sellerFinancingText(input.sellerFinancing) : null,
    stay: input.sellerStay ? sellerStayText(input.sellerStay) : null,
  };
}

export function teaserViewFromPublic(input: {
  codename: string;
  region: string;
  cnaeCode?: string | null;
  foundedYear?: number | null;
  headcount?: HeadcountRangeId | null;
  summary?: string | null;
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
}): CompanyPdfView {
  const band = priceBand(input);
  const terms = dealTerms(input);
  return {
    kind: "teaser",
    codename: input.codename,
    region: input.region,
    cnae: cnaeLine(input.cnaeCode),
    decade: foundedDecade(input.foundedYear),
    headcount: input.headcount ? headcountLabels[input.headcount] : null,
    summary: input.summary?.trim() || null,
    saleReason: terms.saleReason,
    financing: terms.financing,
    stay: terms.stay,
    kpis: headlineKpis(input),
    years: yearsFromSabi(input.reportYears),
    ratios: [],
    gauges: [],
    highlights: buildHighlights(input),
    bridge: [],
    marginPct: marginFromHeadline(input),
    priceLow: band.low,
    priceHigh: band.high,
    asking: band.asking,
    priceLowCents: band.lowCents,
    priceHighCents: band.highCents,
    askingCents: band.askingCents,
    sectorLabel: band.sectorLabel,
    multipleLow: band.multipleLow,
    multipleHigh: band.multipleHigh,
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
  const ops = dossierGauges(years, input);
  const terms = dealTerms(input);
  return {
    kind: "dossier",
    codename: input.codename,
    region: input.region,
    cnae: cnaeLine(input.principalCnae?.code),
    decade: foundedDecade(input.foundedYear),
    headcount: input.headcountRange ? headcountLabels[input.headcountRange] : null,
    summary: input.description?.trim() || null,
    saleReason: terms.saleReason,
    financing: terms.financing,
    stay: terms.stay,
    kpis: headlineKpis(input),
    years: yearsFromSabi(years),
    ratios: ops.ratios,
    gauges: ops.gauges,
    highlights: buildHighlights({ ...input, summary: input.description, headcount: input.headcountRange }),
    bridge: ebitdaBridge(input),
    marginPct: marginFromHeadline(input),
    priceLow: band.low,
    priceHigh: band.high,
    asking: band.asking,
    priceLowCents: band.lowCents,
    priceHighCents: band.highCents,
    askingCents: band.askingCents,
    sectorLabel: band.sectorLabel,
    multipleLow: band.multipleLow,
    multipleHigh: band.multipleHigh,
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
      "Software de gestión para pymes industriales, con ingresos recurrentes y un equipo técnico consolidado. La cartera se concentra en contratos de mantenimiento plurianuales.",
    saleReason: "jubilacion",
    sellerFinancing: { mode: "yes", maxPct: 20, years: 3 },
    sellerStay: "6m",
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
      "Software de gestión para pymes industriales, con ingresos recurrentes y un equipo técnico consolidado.",
    saleReason: "jubilacion",
    sellerFinancing: { mode: "yes", maxPct: 20, years: 3 },
    sellerStay: "6m",
    reportYears: tecnologiaClosedYears(),
    watermark: "Ana Pérez · ana.perez@example.com · 11 de noviembre de 2026",
  });
}
