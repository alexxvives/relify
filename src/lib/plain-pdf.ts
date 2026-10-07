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

export function plainPdf(text: string): Buffer {
  const commands = ["BT", "/F1 11 Tf", "50 800 Td"];
  wrapPdfLines(text).forEach((line, index) => {
    if (index > 0) {
      commands.push("0 -14 Td");
    }

    commands.push(`(${pdfText(line)}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
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
