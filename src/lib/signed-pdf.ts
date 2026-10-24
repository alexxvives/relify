import { brandLogoJpegBase64, brandLogoSize } from "./brand-logo-jpeg";
import { jpegSize } from "./signature-image";

/*
 * Multi-page A4 template for Relify's signed documents (NDA, LOI, platform terms).
 * Hand-written PDF with the 14 standard fonts, so it runs on the Worker and in the
 * browser (previews) without a PDF library or Buffer.
 */

export type PdfParty = { role: string; name: string; lines: string[] };

export type PdfSigner = {
  role: string;
  name: string;
  idLine: string;
  /** JPEG bytes of the drawn signature; null keeps the box empty ("pendiente"). */
  signature?: Uint8Array | null;
  /** Draws Relify's platform seal instead of a handwritten signature. */
  stamp?: boolean;
  signedAt?: string | null;
};

export type SignedPdfInput = {
  title: string;
  reference: string;
  dateLabel: string;
  parties: PdfParty[];
  intro?: string;
  clauses: string[];
  signers: PdfSigner[];
  note: string;
  draft?: boolean;
};

const W = 595;
const H = 842;
const M = 56;
const TOP = 770;
const BOTTOM = 84;

const NAVY = "0.110 0.153 0.251";
const BRAND = "0.153 0.639 0.667";
const MUTED = "0.361 0.420 0.471";
const LINE = "0.863 0.886 0.910";
const PANEL = "0.965 0.969 0.980";

// Helvetica advance widths (1/1000 em) for ASCII 32..126.
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
  556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

function baseChar(char: string): string {
  return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || char;
}

export function textWidth(value: string, size: number, bold = false): number {
  let total = 0;
  for (const char of value) {
    const code = (baseChar(char).codePointAt(0) ?? 63) - 32;
    total += HELV[code] ?? 556;
  }
  return (total * size * (bold ? 1.06 : 1)) / 1000;
}

const WIN_ANSI: Record<string, string> = {
  á: "\\341", é: "\\351", í: "\\355", ó: "\\363", ú: "\\372", Á: "\\301", É: "\\311", Í: "\\315", Ó: "\\323", Ú: "\\332",
  ñ: "\\361", Ñ: "\\321", ü: "\\374", Ü: "\\334", "¿": "\\277", "¡": "\\241", "·": "\\267", "€": "\\200", "º": "\\272",
  "ª": "\\252", "–": "\\226", "—": "\\227", "“": "\\223", "”": "\\224", "‘": "\\221", "’": "\\222", "…": "\\205",
  "\\": "\\\\", "(": "\\(", ")": "\\)",
};

function lit(value: string): string {
  let out = "";
  for (const char of value) {
    const mapped = WIN_ANSI[char];
    if (mapped) {
      out += mapped;
      continue;
    }
    const code = char.codePointAt(0) ?? 63;
    out += code > 126 || code < 32 ? "?" : char;
  }
  return `(${out})`;
}

export function wrapText(text: string, size: number, width: number, bold = false): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next, size, bold) > width) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }
  return `${out}>`;
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function text(x: number, y: number, size: number, value: string, opts: { bold?: boolean; color?: string } = {}): string {
  return `BT /${opts.bold ? "F2" : "F1"} ${size} Tf ${opts.color ?? NAVY} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm ${lit(value)} Tj ET`;
}

function circle(cx: number, cy: number, r: number): string {
  const k = r * 0.5523;
  return [
    `${cx + r} ${cy} m`,
    `${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} c`,
    `${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} c`,
    `${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} c`,
    `${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} c`,
  ].join(" ");
}

/** Relify's platform seal: double ring, wordmark and the signing date. Vector, no image. */
function stamp(cx: number, cy: number, date: string): string[] {
  const centred = (value: string, size: number, y: number, bold = false) =>
    text(cx - textWidth(value, size, bold) / 2, y, size, value, { bold, color: BRAND });
  return [
    "q",
    `${BRAND} RG 1.6 w ${circle(cx, cy, 34)} S`,
    `0.7 w ${circle(cx, cy, 29)} S`,
    "Q",
    centred("RELIFY", 10, cy + 4, true),
    centred("FIRMA DE PLATAFORMA", 4.6, cy - 5),
    centred(date, 4.6, cy - 13),
  ];
}

type Page = string[];

export function signedPdf(input: SignedPdfInput): Uint8Array<ArrayBuffer> {
  const pages: Page[] = [];
  let page: Page = [];
  let y = TOP;
  const contentWidth = W - 2 * M;

  function newPage() {
    page = [];
    pages.push(page);
    y = TOP;
  }

  function ensure(space: number) {
    if (y - space < BOTTOM) {
      newPage();
    }
  }

  newPage();

  // Title block.
  page.push(text(M, y - 8, 9, input.draft ? "BORRADOR · PENDIENTE DE FIRMA" : "DOCUMENTO FIRMADO EN RELIFY", { bold: true, color: BRAND }));
  y -= 34;
  for (const line of wrapText(input.title, 20, contentWidth, true)) {
    page.push(text(M, y, 20, line, { bold: true }));
    y -= 24;
  }
  page.push(text(M, y, 9.5, `${input.dateLabel}   ·   Ref. ${input.reference}`, { color: MUTED }));
  y -= 26;

  // Parties.
  page.push(text(M, y, 8, "REUNIDOS", { bold: true, color: MUTED }));
  y -= 10;
  const gap = 12;
  const cardWidth = (contentWidth - gap * (input.parties.length - 1)) / Math.max(1, input.parties.length);
  const cardLines = input.parties.map((party) => party.lines.flatMap((line) => wrapText(line, 8.5, cardWidth - 24)));
  const cardHeight = 46 + Math.max(0, ...cardLines.map((lines) => lines.length)) * 12;
  input.parties.forEach((party, index) => {
    const x = M + index * (cardWidth + gap);
    page.push(`${PANEL} rg ${x} ${y - cardHeight} ${cardWidth} ${cardHeight} re f`);
    page.push(`${BRAND} rg ${x} ${y - cardHeight} 3 ${cardHeight} re f`);
    page.push(text(x + 14, y - 16, 7.5, party.role.toUpperCase(), { bold: true, color: MUTED }));
    page.push(text(x + 14, y - 31, 11, party.name, { bold: true }));
    (cardLines[index] ?? []).forEach((line, row) => {
      page.push(text(x + 14, y - 46 - row * 12, 8.5, line, { color: MUTED }));
    });
  });
  y -= cardHeight + 24;

  // Body.
  if (input.intro) {
    for (const line of wrapText(input.intro, 10.5, contentWidth)) {
      ensure(16);
      page.push(text(M, y, 10.5, line));
      y -= 15;
    }
    y -= 8;
  }
  page.push(text(M, y, 8, "ACUERDAN", { bold: true, color: MUTED }));
  y -= 18;
  input.clauses.forEach((clause, index) => {
    const body = clause.replace(/^\d+\.\s*/, "");
    const lines = wrapText(body, 10.5, contentWidth - 22);
    ensure(Math.min(lines.length, 3) * 15);
    page.push(text(M, y, 10.5, `${index + 1}.`, { bold: true, color: BRAND }));
    for (const line of lines) {
      ensure(15);
      page.push(text(M + 22, y, 10.5, line));
      y -= 15;
    }
    y -= 7;
  });

  // Signatures.
  ensure(170 + wrapText(input.note, 7.5, contentWidth).length * 11 + 12);
  y -= 6;
  page.push(text(M, y, 8, "FIRMAS", { bold: true, color: MUTED }));
  y -= 12;
  const boxWidth = (contentWidth - gap) / 2;
  const boxHeight = 132;
  const images: { name: string; bytes: Uint8Array; width: number; height: number }[] = [];
  input.signers.slice(0, 2).forEach((signer, index) => {
    const x = M + index * (boxWidth + gap);
    const top = y;
    page.push(`${LINE} RG 0.8 w ${x} ${top - boxHeight} ${boxWidth} ${boxHeight} re S`);
    page.push(text(x + 14, top - 16, 7.5, signer.role.toUpperCase(), { bold: true, color: MUTED }));
    const areaBottom = top - 86;
    const size = signer.signature ? jpegSize(signer.signature) : null;
    if (signer.stamp && !input.draft) {
      page.push(...stamp(x + boxWidth / 2, areaBottom + 34, signer.signedAt ?? input.dateLabel));
    } else if (signer.signature && size && !input.draft) {
      const name = `Sig${index}`;
      images.push({ name, bytes: signer.signature, ...size });
      const scale = Math.min((boxWidth - 40) / size.width, 56 / size.height);
      const w = size.width * scale;
      const h = size.height * scale;
      page.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${(x + (boxWidth - w) / 2).toFixed(2)} ${(areaBottom + 4).toFixed(2)} cm /${name} Do Q`);
    } else {
      const pending = "Pendiente de firma";
      page.push(text(x + (boxWidth - textWidth(pending, 9)) / 2, areaBottom + 26, 9, pending, { color: MUTED }));
    }
    page.push(`${LINE} RG 0.6 w ${x + 14} ${areaBottom} m ${x + boxWidth - 14} ${areaBottom} l S`);
    page.push(text(x + 14, areaBottom - 14, 9.5, signer.name, { bold: true }));
    page.push(text(x + 14, areaBottom - 27, 8, signer.idLine, { color: MUTED }));
    const when = input.draft ? "Sin firmar" : signer.signedAt ? `Firmado el ${signer.signedAt}` : "Sin firmar";
    page.push(text(x + 14, areaBottom - 39, 8, when, { color: MUTED }));
  });
  y -= boxHeight + 16;
  for (const line of wrapText(input.note, 7.5, contentWidth)) {
    ensure(11);
    page.push(text(M, y, 7.5, line, { color: MUTED }));
    y -= 10;
  }

  // Chrome on every page: logo header, footer with page numbers, optional draft mark.
  const total = pages.length;
  const logoHeight = 24;
  const logoWidth = (brandLogoSize.width / brandLogoSize.height) * logoHeight;
  const streams = pages.map((body, index) => {
    const chrome = [
      `q ${logoWidth.toFixed(2)} 0 0 ${logoHeight} ${M} 792 cm /Logo Do Q`,
      text(W - M - textWidth(input.title, 8), 806, 8, input.title, { color: MUTED }),
      text(W - M - textWidth(`Ref. ${input.reference}`, 8), 795, 8, `Ref. ${input.reference}`, { color: MUTED }),
      `${BRAND} rg ${M} 782 ${contentWidth} 1.2 re f`,
      `${LINE} RG 0.6 w ${M} 60 m ${W - M} 60 l S`,
      text(M, 46, 7.5, "Relify  ·  itsreleva.com  ·  Documento generado y custodiado por Relify", { color: MUTED }),
    ];
    const label = `Página ${index + 1} de ${total}`;
    chrome.push(text(W - M - textWidth(label, 7.5), 46, 7.5, label, { color: MUTED }));
    const watermark = input.draft
      ? [`q BT /F2 84 Tf 0.95 0.96 0.97 rg 0.7071 0.7071 -0.7071 0.7071 150 260 Tm ${lit("BORRADOR")} Tj ET Q`]
      : [];
    return [...watermark, ...chrome, ...body].join("\n");
  });

  // Assemble objects.
  const encoder = new TextEncoder();
  const objects: string[] = [];
  const add = (value: string) => {
    objects.push(value);
    return objects.length;
  };
  const catalog = add("");
  const pagesRef = add("");
  const font1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const font2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const imageObject = (bytes: Uint8Array, width: number, height: number) => {
    const data = hex(bytes);
    return add(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${data.length} >>\nstream\n${data}\nendstream`,
    );
  };
  const logo = imageObject(fromBase64(brandLogoJpegBase64), brandLogoSize.width, brandLogoSize.height);
  const xobjects = [`/Logo ${logo} 0 R`, ...images.map((image) => `/${image.name} ${imageObject(image.bytes, image.width, image.height)} 0 R`)];
  const resources = `<< /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> /XObject << ${xobjects.join(" ")} >> >>`;
  const kids = streams.map((stream) => {
    const content = add(`<< /Length ${encoder.encode(stream).byteLength} >>\nstream\n${stream}\nendstream`);
    return add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${content} 0 R /Resources ${resources} >>`);
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;
  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${kids.map((kid) => `${kid} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  const info = add(`<< /Title ${lit(input.title)} /Producer (Relify) /Creator (Relify) >>`);

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(body).byteLength);
    body += `${index + 1} 0 obj ${object} endobj\n`;
  });
  const xref = encoder.encode(body).byteLength;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return encoder.encode(body);
}
