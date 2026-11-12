import { mkdirSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  buildCompanyPdf,
  companyPdfFileName,
  companyPdfHasIdentity,
  headlineKpis,
  sampleDossierView,
  sampleTeaserView,
  teaserViewFromPublic,
} from "@/lib/company-pdf";

function inflateMaybe(payload: string): string {
  try {
    return inflateSync(Buffer.from(payload, "latin1")).toString("latin1");
  } catch {
    return payload;
  }
}

function utf16be(buf: Buffer): string {
  if (buf.length % 2 === 1) {
    return buf.toString("latin1");
  }
  let out = "";
  for (let i = 0; i < buf.length; i += 2) {
    out += String.fromCharCode((buf[i] ?? 0) * 256 + (buf[i + 1] ?? 0));
  }
  return out;
}

function decodeWithCmap(inflated: string, cmap: Map<number, string>): string {
  const twoByte = [...cmap.keys()].some((code) => code > 255);
  return inflated.replace(/<([0-9A-Fa-f]+)>/g, (_full, hex: string) => {
    const buf = Buffer.from(hex, "hex");
    let out = "";
    if (twoByte) {
      for (let i = 0; i + 1 < buf.length; i += 2) {
        out += cmap.get((buf[i] ?? 0) * 256 + (buf[i + 1] ?? 0)) ?? "";
      }
      return out;
    }
    for (const byte of buf) {
      out += cmap.get(byte) ?? "";
    }
    return out;
  });
}

function pdfPlain(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  const cmaps: Array<Map<number, string>> = [];
  const inflatedStreams: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    const payload = match[1];
    if (!payload || payload.charCodeAt(0) === 0xff) {
      continue;
    }
    const inflated = inflateMaybe(payload);
    inflatedStreams.push(inflated);
    for (const block of inflated.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      const cmap = new Map<number, string>();
      for (const row of (block[1] ?? "").matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        const from = row[1];
        const to = row[2];
        if (!from || !to) {
          continue;
        }
        cmap.set(Number.parseInt(from, 16), utf16be(Buffer.from(to, "hex")));
      }
      if (cmap.size > 0) {
        cmaps.push(cmap);
      }
    }
  }
  return inflatedStreams
    .flatMap((inflated) => cmaps.map((cmap) => decodeWithCmap(inflated, cmap).replace(/\0/g, "")))
    .join("\n");
}

describe("company PDF views", () => {
  it("keeps identity off the teaser payload and uses reportHeadline figures", () => {
    const view = sampleTeaserView();
    expect(companyPdfHasIdentity(view)).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/Empresa Tecnolog/i);
    expect(JSON.stringify(view)).not.toMatch(/Tecnologia Digital/i);
    expect(JSON.stringify(view)).not.toMatch(/B\d{8}/);
    expect(view.codename).toBe("Proyecto Quercus");
    expect(view.kpis).toHaveLength(3);
    expect(view.kpis[0]?.value).toBe("5 M €");
    expect(view.kpis[1]?.label).toBe("EBITDA aj.");
    expect(view.kpis[1]?.value).toBe("800 K €");
    expect(view.kpis[2]?.value).toBe("4 M €");
    expect(view.years).toHaveLength(4);
    expect(view.ratios).toHaveLength(0);
    expect(view.gauges).toHaveLength(0);
    expect(view.bridge).toHaveLength(0);
    expect(view.saleReason).toBe("Jubilación");
    expect(view.financing).toMatch(/financiar/i);
    expect(view.stay).toMatch(/6 meses/);
    expect(view.priceLowCents).not.toBeNull();
    expect(view.priceHighCents).not.toBeNull();
    expect(view.askingCents).toBe(400_000_000);
    expect(view.highlights.length).toBeGreaterThan(0);
    expect(view.highlights.join(" ")).not.toMatch(/ficha p[uú]blica/i);
    expect(view.highlights.join(" ")).not.toMatch(/nombre de proyecto/i);
  });

  it("drops thesis lines that talk about the platform, not the company", () => {
    const view = teaserViewFromPublic({
      codename: "Proyecto Alba",
      region: "Valencia",
      revenueCents: 1_250_000_00,
      ebitdaCents: 180_000_00,
      adjustedEbitdaCents: 180_000_00,
      askingPriceCents: 900_000_00,
      ebitdaAdjustments: null,
      summary:
        "Cartera industrial con contratos plurianuales. La ficha pública enseña el nombre de proyecto y las cifras de cabecera; la sociedad no figura.",
      generatedLabel: "11 de noviembre de 2026",
    });
    expect(view.highlights.join(" ")).toMatch(/contratos plurianuales/i);
    expect(view.highlights.join(" ")).not.toMatch(/ficha p[uú]blica/i);
    expect(view.highlights.join(" ")).not.toMatch(/sociedad no figura/i);
  });

  it("watermarks the dossier with the buyer and still omits company identity", () => {
    const view = sampleDossierView();
    expect(companyPdfHasIdentity(view)).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/Empresa Tecnolog/i);
    expect(view.watermark).toMatch(/ana\.perez@example\.com/i);
    expect(view.years).toHaveLength(4);
    expect(view.ratios.some((row) => /Deuda neta/i.test(row.label))).toBe(true);
    expect(view.ratios.some((row) => row.label === "NOF")).toBe(true);
    expect(view.gauges.some((row) => row.label === "NOF")).toBe(true);
    expect(view.bridge.some((row) => row.kind === "start")).toBe(true);
    expect(view.bridge.some((row) => row.kind === "end")).toBe(true);
  });

  it("names files without accents or spaces", () => {
    expect(companyPdfFileName("teaser", "Proyecto Quercus")).toBe("relify-perfil-ciego-proyecto-quercus.pdf");
    expect(companyPdfFileName("dossier", "Proyecto Norte")).toBe("relify-cuaderno-de-venta-proyecto-norte.pdf");
  });
});

describe("buildCompanyPdf", () => {
  it("builds teaser and dossier bytes and writes samples when asked", async () => {
    const teaser = await buildCompanyPdf(sampleTeaserView());
    const dossier = await buildCompanyPdf(sampleDossierView());
    expect(teaser.byteLength).toBeGreaterThan(800);
    expect(dossier.byteLength).toBeGreaterThan(1200);
    expect(Buffer.from(teaser).subarray(0, 5).toString()).toBe("%PDF-");
    expect(Buffer.from(teaser).includes(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(Buffer.from(teaser).toString("latin1")).toMatch(/DMSans|Geist/);
    const teaserText = pdfPlain(teaser);
    const dossierText = pdfPlain(dossier);
    expect(teaserText).toMatch(/Relify/);
    expect(teaserText).toMatch(/Proyecto Quercus/);
    expect(teaserText).toMatch(/NDA/);
    expect(teaserText).toMatch(/Jubilaci/);
    expect(teaserText).toMatch(/Mix de la cifra/);
    expect(teaserText).toMatch(/Costes operativos|Resultado neto|EBITDA/);
    expect(teaserText).not.toMatch(/Deuda neta/);
    expect(teaserText).not.toMatch(/ficha p[uú]blica/i);
    expect(teaserText).not.toMatch(/ana\.perez@example\.com/i);
    expect(dossierText).toMatch(/ana\.perez@example\.com/i);
    expect(dossierText).toMatch(/Deuda neta/);
    expect(dossierText).toMatch(/NOF/);
    expect(dossierText).toMatch(/EBITDA declarado/);
    const out =
      process.env.ROUND_S8_PDF_OUT ??
      process.env.ROUND_S7_PDF_OUT ??
      process.env.ROUND_S6_PDF_OUT ??
      process.env.ROUND_S5_PDF_OUT ??
      process.env.ROUND_S4_PDF_OUT;
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(`${out}/teaser-proyecto-quercus.pdf`, teaser);
      writeFileSync(`${out}/dossier-proyecto-quercus.pdf`, dossier);
    }
  });
});

describe("headlineKpis", () => {
  it("reads the same published headline as marketplace cards", () => {
    const kpis = headlineKpis({
      revenueCents: 5_000_000_00,
      ebitdaCents: 750_000_00,
      adjustedEbitdaCents: 750_000_00,
      askingPriceCents: 4_000_000_00,
      ebitdaAdjustments: null,
    });
    expect(kpis[0]?.value).toBe("5 M €");
    expect(kpis[1]?.label).toBe("EBITDA");
    expect(kpis[1]?.value).toBe("750 K €");
  });
});
