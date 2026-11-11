import { mkdirSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

function pdfPlain(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  return [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map((match) => {
      const payload = match[1];
      if (!payload) {
        return "";
      }
      try {
        const inflated = inflateSync(Buffer.from(payload, "latin1")).toString("latin1");
        return inflated.replace(/<([0-9A-Fa-f]+)>/g, (_full, hex: string) => Buffer.from(hex, "hex").toString("latin1"));
      } catch {
        return payload;
      }
    })
    .join("\n");
}
import {
  buildCompanyPdf,
  companyPdfFileName,
  companyPdfHasIdentity,
  headlineKpis,
  sampleDossierView,
  sampleTeaserView,
} from "./company-pdf";

describe("company PDF views", () => {
  it("keeps identity off the teaser payload and uses reportHeadline figures", () => {
    const view = sampleTeaserView();
    expect(companyPdfHasIdentity(view)).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/Tecnolog/i);
    expect(view.kpis).toHaveLength(3);
    expect(view.kpis[0]?.value).toBe("1,25 M €");
    expect(view.kpis[2]?.value).toBe("980 K €");
  });

  it("watermarks the dossier with the buyer and still omits company identity", () => {
    const view = sampleDossierView();
    expect(companyPdfHasIdentity(view)).toBe(false);
    expect(view.watermark).toMatch(/ana\.perez@example\.com/i);
    expect(view.years).toHaveLength(4);
  });

  it("names files without accents or spaces", () => {
    expect(companyPdfFileName("teaser", "Proyecto Alba")).toBe("relify-perfil-ciego-proyecto-alba.pdf");
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
    expect(pdfPlain(dossier)).toMatch(/ana\.perez@example\.com/i);
    const out = process.env.ROUND_S4_PDF_OUT;
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(`${out}/teaser-proyecto-alba.pdf`, teaser);
      writeFileSync(`${out}/dossier-proyecto-alba.pdf`, dossier);
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
