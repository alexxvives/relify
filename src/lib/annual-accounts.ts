import { inflateRawSync } from "node:zlib";
import {
  isStatementYear,
  pnlInputKeys,
  statementEbitda,
  type BalanceInputKey,
  type PnlAmounts,
  type PnlInputKey,
} from "./company-profile";

export const maxAnnualAccountsBytes = 8 * 1024 * 1024;

const maxZipEntries = 40;
const maxUncompressedEntry = 12 * 1024 * 1024;

const expenseKeys = new Set<PnlInputKey>(["supplies", "staffCosts", "otherOperatingCosts", "amortization"]);

const pnlNames: Record<string, PnlInputKey> = {
  importenetocifranegocios: "sales",
  variaciondeexistenciasdeproductosterminadosyencursodefabricacion: "inventoryChange",
  trabajosrealizadosporlaempresaparasuactivo: "ownUse",
  aprovisionamientos: "supplies",
  otrosingresosdeexplotacion: "otherOperatingIncome",
  gastosdepersonal: "staffCosts",
  otrosgastosdeexplotacion: "otherOperatingCosts",
  amortizaciondelinmovilizado: "amortization",
  imputaciondesubvencionesdeinmovilizadonofinancieroyotras: "grantIncome",
  excesosdeprovisiones: "provisionSurplus",
  deterioroyresultadoporenajenacionesdelinmovilizado: "assetImpairment",
  diferencianegativadecombinacionesdenegocio: "negativeDifference",
  otrosresultados: "otherResults",
};

const balanceNames: Record<string, BalanceInputKey> = {
  activocorriente: "currentAssets",
  efectivoyotrosactivosliquidosequivalentes: "cash",
  activonocorriente: "nonCurrentAssets",
  pasivocorriente: "currentLiabilities",
  deudasalargoplazo: "longTermDebt",
  pasivonocorriente: "nonCurrentLiabilities",
  deudasacortoplazo: "shortTermDebt",
  patrimonioneto: "equity",
};

const modeloKeys: Record<string, PnlInputKey | "operating"> = {
  "00255": "sales",
  "00258": "inventoryChange",
  "00259": "ownUse",
  "00260": "supplies",
  "00265": "otherOperatingIncome",
  "00270": "staffCosts",
  "00279": "otherOperatingCosts",
  "00284": "amortization",
  "00285": "grantIncome",
  "00286": "provisionSurplus",
  "00287": "assetImpairment",
  "00294": "negativeDifference",
  "00295": "otherResults",
  "00296": "operating",
};

export type ParsedStatement = {
  year: number;
  salesCents: number;
  ebitdaCents: number | null;
  pnlCents: Partial<Record<PnlInputKey, number>>;
  balanceCents: Partial<Record<BalanceInputKey, number>>;
};

export type AnnualAccountsParse =
  | { ok: true; statements: ParsedStatement[] }
  | { ok: false; code: "pdf" | "unreadable" | "no-sales" | "no-year" };

type Concept = PnlInputKey | BalanceInputKey | "operating";

type Fact = {
  concept: Concept;
  year: number | null;
  cents: number;
  dimensional: boolean;
};

type Placed = {
  cents: number;
};

type Bucket = {
  pnl: Map<PnlInputKey, Placed>;
  balance: Map<BalanceInputKey, Placed>;
  operating: Placed | null;
};

export function parseAnnualAccounts(bytes: Uint8Array, fileName = ""): AnnualAccountsParse {
  if (bytes.byteLength === 0 || bytes.byteLength > maxAnnualAccountsBytes) {
    return { ok: false, code: "unreadable" };
  }

  if (isZip(bytes)) {
    return parseZip(bytes);
  }

  if (isPdf(bytes, fileName)) {
    return { ok: false, code: "pdf" };
  }

  return parseXmlAccounts(decodeXml(bytes));
}

function parseZip(bytes: Uint8Array): AnnualAccountsParse {
  const entries = unzipTexts(bytes);

  if (!entries.ok) {
    return entries;
  }

  let sawPdf = false;
  let failure: AnnualAccountsParse = { ok: false, code: "unreadable" };

  for (const entry of entries.texts) {
    if (entry.pdf) {
      sawPdf = true;
      continue;
    }

    const parsed = parseXmlAccounts(entry.text);

    if (parsed.ok) {
      return parsed;
    }

    failure = parsed;
  }

  if (sawPdf && !failure.ok && failure.code === "unreadable") {
    return { ok: false, code: "pdf" };
  }

  return failure;
}

function parseXmlAccounts(xml: string): AnnualAccountsParse {
  const contexts = readContexts(xml);
  const fallbackYear = documentYear(xml);
  const facts = readFacts(xml, contexts, fallbackYear);
  const buckets = new Map<number, Bucket>();

  for (const fact of facts) {
    if (fact.year === null || !isStatementYear(fact.year)) {
      continue;
    }

    const bucket = buckets.get(fact.year) ?? emptyBucket();
    placeFact(bucket, fact);
    buckets.set(fact.year, bucket);
  }

  const selected = [...buckets.entries()]
    .filter(([, bucket]) => bucket.pnl.has("sales"))
    .sort((left, right) => left[0] - right[0])
    .slice(-3);

  if (selected.length === 0) {
    const hasSales = facts.some((fact) => fact.concept === "sales");
    return { ok: false, code: hasSales ? "no-year" : "no-sales" };
  }

  return {
    ok: true,
    statements: selected.map(([year, bucket]) => toStatement(year, bucket)),
  };
}

function toStatement(year: number, bucket: Bucket): ParsedStatement {
  const pnlCents: Partial<Record<PnlInputKey, number>> = {};

  for (const [key, placed] of bucket.pnl) {
    pnlCents[key] = expenseKeys.has(key) && placed.cents > 0 ? -placed.cents : placed.cents;
  }

  const salesCents = pnlCents.sales ?? 0;
  const amounts = emptyPnl();

  for (const key of pnlInputKeys) {
    const value = pnlCents[key];
    amounts[key] = value === undefined ? null : value;
  }

  const amortization = pnlCents.amortization;
  const operating = bucket.operating?.cents;
  const ebitdaCents =
    operating !== undefined && amortization !== undefined ? operating - amortization : statementEbitda(amounts);
  const balanceCents: Partial<Record<BalanceInputKey, number>> = {};

  for (const [key, placed] of bucket.balance) {
    balanceCents[key] = placed.cents;
  }

  return { year, salesCents, ebitdaCents, pnlCents, balanceCents };
}

function placeFact(bucket: Bucket, fact: Fact): void {
  if (fact.dimensional) {
    return;
  }

  const placed = { cents: fact.cents };

  if (fact.concept === "operating") {
    bucket.operating = bucket.operating ?? placed;
    return;
  }

  if (isPnlKey(fact.concept)) {
    if (!bucket.pnl.has(fact.concept)) {
      bucket.pnl.set(fact.concept, placed);
    }

    return;
  }

  if (!bucket.balance.has(fact.concept)) {
    bucket.balance.set(fact.concept, placed);
  }
}

function emptyBucket(): Bucket {
  return { pnl: new Map(), balance: new Map(), operating: null };
}

function emptyPnl(): PnlAmounts {
  return {
    sales: null,
    inventoryChange: null,
    ownUse: null,
    supplies: null,
    otherOperatingIncome: null,
    staffCosts: null,
    otherOperatingCosts: null,
    grantIncome: null,
    provisionSurplus: null,
    assetImpairment: null,
    subsidiaryControlLoss: null,
    negativeDifference: null,
    otherResults: null,
    amortization: null,
  };
}

function readContexts(xml: string): Map<string, { year: number | null; dimensional: boolean }> {
  const contexts = new Map<string, { year: number | null; dimensional: boolean }>();
  const pattern = /<(?:[\w.-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?context>/gi;

  for (const match of xml.matchAll(pattern)) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    const id = attribute(attrs, "id");

    if (!id) {
      continue;
    }

    contexts.set(id, { year: contextYear(body), dimensional: /<(?:[\w.-]+:)?(?:segment|scenario)\b/i.test(body) });
  }

  return contexts;
}

function contextYear(body: string): number | null {
  const end = body.match(/<(?:[\w.-]+:)?endDate\b[^>]*>(\d{4})-\d{2}-\d{2}/);
  const instant = body.match(/<(?:[\w.-]+:)?instant\b[^>]*>(\d{4})-\d{2}-\d{2}/);
  const yearText = end?.[1] ?? instant?.[1];

  if (!yearText) {
    return null;
  }

  const year = Number(yearText);
  return isStatementYear(year) ? year : null;
}

function documentYear(xml: string): number | null {
  const element = xml.match(/<(?:[\w.-]+:)?ejercicio\b[^>]*>(\d{4})</i);
  const attributeYear = xml.match(/\bejercicio\s*=\s*"(\d{4})"/i);
  const yearText = element?.[1] ?? attributeYear?.[1];

  if (!yearText) {
    return null;
  }

  const year = Number(yearText);
  return isStatementYear(year) ? year : null;
}

function readFacts(
  xml: string,
  contexts: Map<string, { year: number | null; dimensional: boolean }>,
  fallbackYear: number | null,
): Fact[] {
  const facts: Fact[] = [];
  const pattern = /<([\w.-]+(?::[\w.-]+)?)([^>]*)>([^<]*)<\/\1>/g;

  for (const match of xml.matchAll(pattern)) {
    const tag = match[1] ?? "";
    const attrs = match[2] ?? "";
    const text = match[3] ?? "";

    if (/\bnil\s*=\s*"true"/i.test(attrs)) {
      continue;
    }

    const contextRef = attribute(attrs, "contextRef");
    const context = contextRef ? contexts.get(contextRef) : undefined;
    const year = context?.year ?? (contextRef ? null : fallbackYear);
    const dimensional = context?.dimensional ?? false;
    const concept = conceptFrom(tag, attrs);

    if (!concept || year === null) {
      continue;
    }

    const cents = parseCents(text, attribute(attrs, "scale"));

    if (cents === null) {
      continue;
    }

    facts.push({ concept, year, cents, dimensional });
  }

  return facts;
}

function conceptFrom(tag: string, attrs: string): Concept | null {
  const named = attribute(attrs, "name") ?? attribute(attrs, "clave") ?? attribute(attrs, "key");
  return lookupConcept(named ?? tag);
}

function lookupConcept(raw: string): Concept | null {
  const local = raw
    .slice(raw.lastIndexOf(":") + 1)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const pnl = pnlNames[local];

  if (pnl) {
    return pnl;
  }

  if (local === "resultadodeexplotacion") {
    return "operating";
  }

  const balance = balanceNames[local];

  if (balance) {
    return balance;
  }

  const key = /(?:^|clave|casilla|c)(00\d{3})$/.exec(local)?.[1];
  return key ? (modeloKeys[key] ?? null) : null;
}

function parseCents(raw: string, scale: string | null): number | null {
  const text = raw.trim().replace(/\s/g, "");

  if (text.length === 0 || text === "-") {
    return null;
  }

  let normalized = text;

  if (text.includes(",") && text.includes(".")) {
    normalized =
      text.lastIndexOf(",") > text.lastIndexOf(".") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    normalized = text.replace(",", ".");
  }

  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return null;
  }

  const factor = scale === null || scale.trim() === "" ? 1 : 10 ** Number(scale);

  if (!Number.isFinite(factor)) {
    return null;
  }

  const cents = Math.round(value * factor * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function attribute(attrs: string, name: string): string | null {
  const match = new RegExp(String.raw`(?:^|\s)${name}\s*=\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(attrs);
  return match?.[1] ?? match?.[2] ?? null;
}

function isPnlKey(concept: Concept): concept is PnlInputKey {
  return pnlInputKeys.includes(concept as PnlInputKey);
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function isPdf(bytes: Uint8Array, fileName: string): boolean {
  const header = Buffer.from(bytes.subarray(0, 5)).toString("ascii");

  if (header.startsWith("%PDF")) {
    return true;
  }

  return fileName.toLowerCase().endsWith(".pdf");
}

function decodeXml(bytes: Uint8Array): string {
  const head = Buffer.from(bytes.subarray(0, 240)).toString("ascii");
  const encoding = /encoding\s*=\s*["']([^"']+)["']/i.exec(head)?.[1]?.toLowerCase() ?? "utf-8";

  if (encoding === "iso-8859-1" || encoding === "latin1" || encoding === "windows-1252") {
    return Buffer.from(bytes).toString("latin1");
  }

  return Buffer.from(bytes).toString("utf8");
}

type ZipTexts = { ok: true; texts: Array<{ text: string; pdf: boolean }> } | { ok: false; code: "unreadable" };

function unzipTexts(bytes: Uint8Array): ZipTexts {
  const buffer = Buffer.from(bytes);
  const eocd = findEocd(buffer);

  if (eocd < 0) {
    return { ok: false, code: "unreadable" };
  }

  const count = buffer.readUInt16LE(eocd + 10);
  const cdOffset = buffer.readUInt32LE(eocd + 16);

  if (count === 0xffff || cdOffset === 0xffffffff) {
    return { ok: false, code: "unreadable" };
  }

  const texts: Array<{ text: string; pdf: boolean }> = [];
  let cursor = cdOffset;
  const limit = Math.min(count, maxZipEntries);

  for (let index = 0; index < limit; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) {
      break;
    }

    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;

    if (nameStart + nameLength > buffer.length) {
      return { ok: false, code: "unreadable" };
    }

    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    cursor = nameStart + nameLength + extraLength + commentLength;

    if (name.endsWith("/") || uncompressedSize === 0xffffffff || compressedSize === 0xffffffff) {
      continue;
    }

    if (uncompressedSize > maxUncompressedEntry) {
      return { ok: false, code: "unreadable" };
    }

    const readable = /\.(xml|xbrl|xhtml|html|txt)$/i.test(name);
    const pdf = name.toLowerCase().endsWith(".pdf");

    if (!readable && !pdf) {
      continue;
    }

    const payload = inflateEntry(buffer, localOffset, method, compressedSize);

    if (!payload) {
      continue;
    }

    if (payload.length > maxUncompressedEntry) {
      return { ok: false, code: "unreadable" };
    }

    texts.push(pdf ? { text: "", pdf: true } : { text: decodeXml(payload), pdf: false });
  }

  if (texts.length === 0) {
    return { ok: false, code: "unreadable" };
  }

  return { ok: true, texts };
}

function inflateEntry(buffer: Buffer, localOffset: number, method: number, compressedSize: number): Buffer | null {
  if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
    return null;
  }

  const nameLength = buffer.readUInt16LE(localOffset + 26);
  const extraLength = buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + nameLength + extraLength;
  const dataEnd = dataStart + compressedSize;

  if (dataEnd > buffer.length) {
    return null;
  }

  const compressed = buffer.subarray(dataStart, dataEnd);

  if (method === 0) {
    return Buffer.from(compressed);
  }

  if (method !== 8) {
    return null;
  }

  try {
    return inflateRawSync(compressed);
  } catch {
    return null;
  }
}

function findEocd(buffer: Buffer): number {
  const start = Math.max(0, buffer.length - 22 - 65535);

  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  return -1;
}
