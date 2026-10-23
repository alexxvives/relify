import { jpegSize } from "./signature-image";

function pdfText(value: string): string {
  const winAnsi: Record<string, string> = {
    "á": "\\341",
    "é": "\\351",
    "í": "\\355",
    "ó": "\\363",
    "ú": "\\372",
    "Á": "\\301",
    "É": "\\311",
    "Í": "\\315",
    "Ó": "\\323",
    "Ú": "\\332",
    "ñ": "\\361",
    "Ñ": "\\321",
    "ü": "\\374",
    "Ü": "\\334",
    "¿": "\\277",
    "¡": "\\241",
    "·": "\\267",
    "€": " EUR",
    "\\": "\\\\",
    "(": "\\(",
    ")": "\\)",
  };

  let out = "";

  for (const char of value) {
    const mapped = winAnsi[char];
    if (mapped) {
      out += mapped;
      continue;
    }

    const code = char.codePointAt(0) ?? 63;
    out += code > 126 ? "?" : char;
  }

  return out;
}

export function wrapPdfLines(text: string, width = 88): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }

    let rest = paragraph;

    while (rest.length > width) {
      const slice = rest.slice(0, width + 1);
      const breakAt = slice.lastIndexOf(" ");
      const cut = breakAt > 20 ? breakAt : width;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }

    lines.push(rest);
  }

  return lines;
}

export type LetterPdfInput = {
  kicker: string;
  title: string;
  date: string;
  lead: string;
  paragraphs: string[];
  signNote: string;
  signatureJpeg?: Buffer | null;
};

function literal(value: string): string {
  return `(${pdfText(value)})`;
}

export function letterPdf(input: LetterPdfInput): Buffer {
  const commands = [
    "0.110 0.153 0.251 rg",
    "0 768 595 74 re f",
    "0.275 0.353 0.706 rg",
    "0 768 595 4 re f",
    "BT",
    "/F2 22 Tf",
    "1 1 1 rg",
    "1 0 0 1 48 808 Tm",
    `${literal("Relify")} Tj`,
    "/F1 9 Tf",
    "0.816 0.847 0.910 rg",
    "1 0 0 1 48 788 Tm",
    `${literal(input.kicker)} Tj`,
    "ET",
    "BT",
    "/F2 16 Tf",
    "0.110 0.153 0.251 rg",
    "1 0 0 1 48 730 Tm",
    `${literal(input.title)} Tj`,
    "/F1 10 Tf",
    "0.361 0.420 0.471 rg",
    "1 0 0 1 48 710 Tm",
    `${literal(input.date)} Tj`,
    "ET",
    "0.863 0.886 0.910 RG",
    "0.8 w",
    "48 696 m 547 696 l S",
    "BT",
    "/F1 10 Tf",
    "0.361 0.420 0.471 rg",
  ];
  let y = 674;

  for (const line of wrapPdfLines(input.lead, 92)) {
    commands.push(`1 0 0 1 48 ${y} Tm`);
    commands.push(`${literal(line)} Tj`);
    y -= 14;
  }

  y -= 10;
  commands.push("ET");
  commands.push("BT");
  commands.push("/F1 11 Tf");
  commands.push("0.110 0.153 0.251 rg");

  for (const paragraph of input.paragraphs) {
    for (const line of wrapPdfLines(paragraph, 88)) {
      if (y < 176) {
        break;
      }

      commands.push(`1 0 0 1 48 ${y} Tm`);
      commands.push(`${literal(line)} Tj`);
      y -= 16;
    }

    y -= 8;
  }

  commands.push("ET");
  commands.push("0.965 0.969 0.980 rg");
  commands.push("48 96 499 62 re f");
  commands.push("0.275 0.353 0.706 rg");
  commands.push("48 96 3 62 re f");
  const signature = input.signatureJpeg && jpegSize(input.signatureJpeg) ? input.signatureJpeg : null;
  const size = signature ? jpegSize(signature) : null;
  if (signature && size) {
    commands.push("q");
    commands.push("150 0 0 42 380 106 cm");
    commands.push("/Im Do");
    commands.push("Q");
  }
  commands.push("BT");
  commands.push("/F2 11 Tf");
  commands.push("0.110 0.153 0.251 rg");
  commands.push("1 0 0 1 64 132 Tm");
  commands.push(`${literal("Firma en Relify")} Tj`);
  commands.push("/F1 9 Tf");
  commands.push("0.361 0.420 0.471 rg");
  commands.push("1 0 0 1 64 114 Tm");
  commands.push(`${literal(input.signNote)} Tj`);
  commands.push("ET");
  commands.push("0.863 0.886 0.910 RG");
  commands.push("0.6 w");
  commands.push("48 78 m 547 78 l S");
  commands.push("BT");
  commands.push("/F1 8 Tf");
  commands.push("0.545 0.580 0.627 rg");
  commands.push("1 0 0 1 48 62 Tm");
  commands.push(`${literal("Relify  ·  Borrador del proceso  ·  No incluye razón social, CIF ni domicilio")} Tj`);
  commands.push("ET");

  const stream = commands.join("\n");
  const hex = signature ? `${signature.toString("hex")}>` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    signature && size
      ? "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im 7 0 R >> >> >>"
      : "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  if (signature && size) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length ${Buffer.byteLength(hex)} >>\nstream\n${hex}\nendstream`,
    );
  }
  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj ${object} endobj\n`;
  });

  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}
