/**
 * Minimal, dependency-free .xlsx reader for SABI (Bureau van Dijk) exports.
 *
 * SABI writes non-standard workbooks (`xl/Styles.xml`, `xl/Media`, style indexes that common
 * libraries reject), so this reads only what the parser needs: the zip central directory,
 * shared strings, and the cell values of the first worksheet. Runs in Workers and Node.
 */

export type SheetCell = { text: string; number: number | null };

/** Row number (1-based) to column number (1-based) to cell. */
export type SheetGrid = Map<number, Map<number, SheetCell>>;

export class XlsxError extends Error {
  constructor(readonly code: "not_zip" | "no_sheet" | "unsupported" | "too_large") {
    super(code);
  }
}

const maxEntryBytes = 20 * 1024 * 1024;

type ZipEntry = { name: string; method: number; compressedSize: number; size: number; offset: number };

function readU16(view: DataView, at: number): number {
  return view.getUint16(at, true);
}

function readU32(view: DataView, at: number): number {
  return view.getUint32(at, true);
}

function listEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;

  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65_557); at -= 1) {
    if (readU32(view, at) === 0x06054b50) {
      end = at;
      break;
    }
  }

  if (end < 0) {
    throw new XlsxError("not_zip");
  }

  const count = readU16(view, end + 10);
  let at = readU32(view, end + 16);
  const entries: ZipEntry[] = [];
  const decoder = new TextDecoder();

  for (let index = 0; index < count; index += 1) {
    if (at + 46 > bytes.length || readU32(view, at) !== 0x02014b50) {
      throw new XlsxError("not_zip");
    }

    const method = readU16(view, at + 10);
    const compressedSize = readU32(view, at + 20);
    const size = readU32(view, at + 24);
    const nameLength = readU16(view, at + 28);
    const extraLength = readU16(view, at + 30);
    const commentLength = readU16(view, at + 32);
    const offset = readU32(view, at + 42);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    entries.push({ name, method, compressedSize, size, offset });
    at += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntry(bytes: Uint8Array, entry: ZipEntry): Promise<string> {
  if (entry.size > maxEntryBytes) {
    throw new XlsxError("too_large");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (readU32(view, entry.offset) !== 0x04034b50) {
    throw new XlsxError("not_zip");
  }

  const start = entry.offset + 30 + readU16(view, entry.offset + 26) + readU16(view, entry.offset + 28);
  const raw = bytes.subarray(start, start + entry.compressedSize);
  let data: Uint8Array;

  if (entry.method === 0) {
    data = raw;
  } else if (entry.method === 8) {
    data = await inflateRaw(raw);
  } else {
    throw new XlsxError("unsupported");
  }

  return new TextDecoder().decode(data);
}

export function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_match, entity: string) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }

    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity] ?? "";
  });
}

/** Concatenates every <t> run inside a shared-string or inline-string node. */
function runsText(xml: string): string {
  const parts: string[] = [];

  for (const match of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) {
    parts.push(decodeXml(match[1] ?? ""));
  }

  return parts.join("").replace(/^\uFEFF/, "");
}

export function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];

  for (const match of xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>|<si\s*\/>/g)) {
    strings.push(match[1] === undefined ? "" : runsText(match[1]));
  }

  return strings;
}

export function columnNumber(letters: string): number {
  let value = 0;

  for (const letter of letters.toUpperCase()) {
    value = value * 26 + (letter.charCodeAt(0) - 64);
  }

  return value;
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? decodeXml(match[1] ?? "") : null;
}

export function parseSheetXml(xml: string, shared: string[]): SheetGrid {
  const grid: SheetGrid = new Map();

  for (const match of xml.matchAll(/<c(\s[^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const tag = match[1] ?? "";
    const body = match[2] ?? "";
    const ref = attribute(tag, "r");
    const position = ref ? /^([A-Z]+)(\d+)$/i.exec(ref) : null;

    if (!position) {
      continue;
    }

    const type = attribute(tag, "t");
    const valueMatch = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body);
    let text: string;
    let number: number | null = null;

    if (type === "inlineStr") {
      text = runsText(body);
    } else if (!valueMatch) {
      continue;
    } else if (type === "s") {
      text = shared[Number(valueMatch[1])] ?? "";
    } else if (type === "str" || type === "e" || type === "b") {
      text = decodeXml(valueMatch[1] ?? "");
    } else {
      text = decodeXml(valueMatch[1] ?? "");
      const parsed = Number(text);
      number = text.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
    }

    const row = Number(position[2]);
    const column = columnNumber(position[1] ?? "A");
    let cells = grid.get(row);

    if (!cells) {
      cells = new Map();
      grid.set(row, cells);
    }

    cells.set(column, { text, number });
  }

  return grid;
}

function resolveTarget(target: string): string {
  const clean = target.replace(/^\/+/, "");
  return clean.startsWith("xl/") ? clean : `xl/${clean}`;
}

/** Reads the first worksheet of an .xlsx file into a sparse grid. */
export async function readFirstSheet(bytes: Uint8Array): Promise<SheetGrid> {
  const entries = listEntries(bytes);
  const byName = new Map(entries.map((entry) => [entry.name.toLowerCase(), entry]));
  const read = async (name: string) => {
    const entry = byName.get(name.toLowerCase());
    return entry ? readEntry(bytes, entry) : null;
  };

  const workbook = await read("xl/workbook.xml");
  const rels = await read("xl/_rels/workbook.xml.rels");
  let sheetPath: string | null = null;

  if (workbook && rels) {
    const sheetTag = /<sheet\s[^>]*>/.exec(workbook)?.[0] ?? "";
    const relId = attribute(sheetTag, "r:id");

    for (const rel of rels.matchAll(/<Relationship\s[^>]*>/g)) {
      if (relId && attribute(rel[0], "Id") === relId) {
        const target = attribute(rel[0], "Target");
        sheetPath = target ? resolveTarget(target) : null;
      }
    }
  }

  sheetPath ??= entries.find((entry) => /^xl\/worksheets\/[^/]+\.xml$/i.test(entry.name))?.name ?? null;
  const sheetXml = sheetPath ? await read(sheetPath) : null;

  if (!sheetXml) {
    throw new XlsxError("no_sheet");
  }

  const sharedXml = await read("xl/sharedStrings.xml");
  return parseSheetXml(sheetXml, sharedXml ? parseSharedStrings(sharedXml) : []);
}
