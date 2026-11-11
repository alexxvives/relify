import { type PDFPage, type RGB } from "pdf-lib";

/**
 * Lucide 24×24 outlines (same set as the Relify UI). pdf-lib SVG is y-down from
 * options.x/y, so the origin is the icon's top-left.
 */
export const lucideIconPaths = {
  chartColumn: ["M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"],
  trendingUp: ["M16 7h6v6", "m22 7-8.5 8.5-5-5L2 17"],
  banknote: [
    "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
    "M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    "M6 12h.01M18 12h.01",
  ],
  percent: [
    "M19 5L5 19",
    "M6.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
    "M17.5 15a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M16 3.128a4 4 0 0 1 0 7.744",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  ],
  shieldCheck: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "m9 12 2 2 4-4",
  ],
} as const;

export type LucidePdfIcon = keyof typeof lucideIconPaths;

export function drawLucideIcon(
  page: PDFPage,
  name: LucidePdfIcon,
  x: number,
  y: number,
  size: number,
  color: RGB,
): void {
  const scale = size / 24;
  for (const d of lucideIconPaths[name]) {
    page.drawSvgPath(d, {
      x,
      y: y + size,
      scale,
      borderColor: color,
      borderWidth: 1.7,
      borderOpacity: 1,
      opacity: 0,
    });
  }
}
