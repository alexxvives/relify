import { mkdirSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  buildLoiTemplatePdf,
  loiTemplateCopy,
  loiTemplateFileName,
  sampleLoiTemplateView,
} from "./loi-template-pdf";

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

describe("LOI template PDF", () => {
  it("names the file without accents", () => {
    expect(loiTemplateFileName("Proyecto Quercus")).toBe("relify-carta-de-intenciones-proyecto-quercus.pdf");
  });

  it("includes the Relify 5% fee, disclaimer, and company-only deal terms", async () => {
    const pdf = await buildLoiTemplatePdf(sampleLoiTemplateView());
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    const text = pdfPlain(pdf);
    expect(text).toMatch(/Plantilla orientativa/);
    expect(text).toMatch(/5 %/);
    expect(text).toMatch(/Laura Vidal/);
    expect(text).toMatch(/Proyecto Quercus/);
    expect(text).toMatch(/Due diligence|revisar la documentaci/i);
    expect(text).not.toMatch(/B\d{8}/);
    const out = process.env.ROUND_S8_PDF_OUT;
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(`${out}/loi-plantilla-proyecto-quercus.pdf`, pdf);
    }
    expect(loiTemplateCopy.disclaimer).toMatch(/asesor legal/);
  });
});
