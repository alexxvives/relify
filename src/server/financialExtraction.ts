import { inflateSync } from "node:zlib";
import { parseAnnualAccounts } from "@/lib/annual-accounts";
import { operatingResult, type PnlAmounts } from "@/lib/company-profile";
import {
  emptyExtraction,
  extractionHasData,
  filingAmountKeys,
  filingCostKeys,
  filingLabels,
  mergeExtractions,
  normaliseModelOutput,
  readCasillas,
  type FilingAmountKey,
  type FilingExtraction,
  type FilingKind,
} from "@/lib/financial-filing";

export type ExtractionResult = { ok: true; extraction: FilingExtraction } | { ok: false; code: "unreadable" | "no-data" };

type AiBinding = {
  run: (model: string, input: unknown) => Promise<unknown>;
  toMarkdown?: (files: Array<{ name: string; blob: Blob }>) => Promise<Array<{ data?: string; format?: string }>>;
};

const textModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const maxPromptChars = 40_000;

async function aiBinding(): Promise<AiBinding | null> {
  try {
    const workers = await import("cloudflare:workers");
    const binding = workers.env.AI as AiBinding | undefined;
    return binding && typeof binding.run === "function" ? binding : null;
  } catch {
    return null;
  }
}

export async function extractFiling(kind: FilingKind, bytes: Uint8Array, fileName: string, year: number): Promise<ExtractionResult> {
  if (kind === "xbrl") {
    return extractXbrl(bytes, fileName, year);
  }

  const ai = await aiBinding();
  const text = await pdfText(bytes, fileName, ai);

  if (text.trim().length < 40) {
    return { ok: false, code: "unreadable" };
  }

  const casillas = kind === "modelo200" ? readCasillas(text) : {};
  const model = ai ? await askModel(ai, text, kind, year) : null;
  const extraction = mergeExtractions(casillas, model);
  return extractionHasData(extraction) ? { ok: true, extraction } : { ok: false, code: "no-data" };
}

function extractXbrl(bytes: Uint8Array, fileName: string, year: number): ExtractionResult {
  const parsed = parseAnnualAccounts(bytes, fileName);

  if (!parsed.ok) {
    return { ok: false, code: parsed.code === "no-sales" || parsed.code === "no-year" ? "no-data" : "unreadable" };
  }

  const statement = parsed.statements.find((item) => item.year === year) ?? parsed.statements[parsed.statements.length - 1];

  if (!statement) {
    return { ok: false, code: "no-data" };
  }

  const extraction = emptyExtraction("xbrl");
  extraction.documentYear = statement.year;
  const pnl = statement.pnlCents;
  const balance = statement.balanceCents;
  const put = (key: FilingAmountKey, cents: number | null | undefined) => {
    if (cents !== null && cents !== undefined) {
      const euros = cents / 100;
      extraction.amounts[key] = { value: filingCostKeys.has(key) ? Math.abs(euros) : euros, confidence: "alta" };
    }
  };
  put("sales", pnl.sales);
  put("supplies", pnl.supplies);
  put("staffCosts", pnl.staffCosts);
  put("amortization", pnl.amortization);
  const full = Object.fromEntries(Object.entries(pnl).map(([key, value]) => [key, value ?? null])) as unknown as PnlAmounts;
  put("operatingResult", operatingResultOrNull(full));
  put("nonCurrentAssets", balance.nonCurrentAssets);
  put("currentAssets", balance.currentAssets);
  put("cash", balance.cash);
  put("equity", balance.equity);
  put("longTermDebt", balance.longTermDebt);
  put("shortTermDebt", balance.shortTermDebt);
  return { ok: true, extraction };
}

function operatingResultOrNull(amounts: PnlAmounts): number | null {
  try {
    return operatingResult(new Proxy(amounts, { get: (target, key) => (key in target ? target[key as keyof PnlAmounts] : 0) }));
  } catch {
    return null;
  }
}

async function pdfText(bytes: Uint8Array, fileName: string, ai: AiBinding | null): Promise<string> {
  if (ai?.toMarkdown) {
    try {
      const [converted] = await ai.toMarkdown([
        { name: fileName.replace(/[^\w.-]/g, "_") || "modelo200.pdf", blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) },
      ]);

      if (converted?.data && converted.data.trim().length > 40) {
        return converted.data;
      }
    } catch {
      // Fall through to the plain reader.
    }
  }

  return plainPdfText(bytes);
}

/** Minimal text reader for simple PDFs (Flate streams, literal Tj/TJ strings). Used when AI is not bound. */
export function plainPdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  let budget = 40;

  while ((match = streamPattern.exec(raw)) && budget-- > 0) {
    const body = Buffer.from(match[1] ?? "", "latin1");
    let content: string;

    try {
      content = inflateSync(body, { maxOutputLength: 4 * 1024 * 1024 }).toString("latin1");
    } catch {
      content = body.toString("latin1");
    }

    const lines: string[] = [];
    const textPattern = /\[((?:\\.|[^\]])*)\]\s*TJ|\(((?:\\.|[^)])*)\)\s*Tj|(T\*|Td|TD|ET)/g;
    let piece: RegExpExecArray | null;
    let line = "";

    while ((piece = textPattern.exec(content))) {
      if (piece[3]) {
        if (line) lines.push(line);
        line = "";
      } else if (piece[2] !== undefined) {
        line += unescapePdf(piece[2]);
      } else if (piece[1] !== undefined) {
        line += [...piece[1].matchAll(/\(((?:\\.|[^)])*)\)/g)].map((part) => unescapePdf(part[1] ?? "")).join("");
      }
    }

    if (line) lines.push(line);
    chunks.push(lines.join("\n"));
  }

  return chunks.join("\n");
}

function unescapePdf(value: string): string {
  return value.replace(/\\([nrtbf()\\]|\d{1,3})/g, (_, code: string) => {
    if (/^\d/.test(code)) return String.fromCharCode(parseInt(code, 8));
    return ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" } as Record<string, string>)[code] ?? code;
  });
}

async function askModel(ai: AiBinding, text: string, kind: FilingKind, year: number) {
  const fieldList = filingAmountKeys.map((key) => `- ${key}: ${filingLabels[key]}`).join("\n");
  const system = [
    "Eres un analista contable español. Extraes cifras de documentos fiscales y contables.",
    "Devuelve solo JSON. No inventes: si un dato no aparece, usa null y confidence \"baja\".",
    "Importes en euros como número (sin separadores de miles). Los gastos en positivo.",
    "confidence: \"alta\" si el importe aparece claramente con su concepto o casilla; \"media\" si lo deduces de una suma directa; \"baja\" si dudas.",
  ].join(" ");
  const user = [
    `Documento: ${kind === "modelo200" ? "Modelo 200 (Impuesto sobre Sociedades)" : "Cuentas anuales"}. Ejercicio esperado: ${year}.`,
    "Usa las cifras del ejercicio actual, no las del ejercicio anterior.",
    "Campos:",
    fieldList,
    "Además: cnae (código de 4 dígitos de la actividad principal) y averageHeadcount (plantilla media, número).",
    'Formato: {"year": number|null, "fields": {"sales": {"value": number|null, "confidence": "alta"|"media"|"baja"}, ...}, "cnae": string|null, "averageHeadcount": number|null}',
    "Texto del documento:",
    text.slice(0, maxPromptChars),
  ].join("\n");

  try {
    const response = (await ai.run(textModel, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0,
    })) as { response?: unknown };
    const body = response?.response;
    const parsed = typeof body === "string" ? JSON.parse(body.slice(body.indexOf("{"), body.lastIndexOf("}") + 1)) : body;
    return normaliseModelOutput(parsed);
  } catch {
    return null;
  }
}
