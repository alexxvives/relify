/**
 * Magic-byte sniffing and metadata strip for uploads.
 * Client Content-Type is not trusted; GPS/EXIF never stays on stored photos.
 */

export const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageMime = (typeof imageMimeTypes)[number];

const dataRoomExtensions = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
]);

function concat(parts: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) {
    total += part.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

function startsWith(bytes: Uint8Array, signature: readonly number[], at = 0): boolean {
  if (bytes.byteLength < at + signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[at + index] === value);
}

export function sniffImageMime(bytes: Uint8Array): ImageMime | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes.byteLength >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** Drop APP0–APP15 and COM so GPS/EXIF/XMP never leave the server. */
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
  if (!startsWith(bytes, [0xff, 0xd8])) {
    return null;
  }
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  let index = 2;
  while (index + 1 < bytes.byteLength) {
    if (bytes[index] !== 0xff) {
      return null;
    }
    const marker = bytes[index + 1];
    if (marker === undefined) {
      return null;
    }
    if (marker === 0xda) {
      parts.push(bytes.subarray(index));
      return concat(parts);
    }
    if (marker === 0xd9) {
      parts.push(bytes.subarray(index, index + 2));
      return concat(parts);
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.subarray(index, index + 2));
      index += 2;
      continue;
    }
    if (index + 3 >= bytes.byteLength) {
      return null;
    }
    const length = ((bytes[index + 2] ?? 0) << 8) | (bytes[index + 3] ?? 0);
    if (length < 2 || index + 2 + length > bytes.byteLength) {
      return null;
    }
    const skip = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!skip) {
      parts.push(bytes.subarray(index, index + 2 + length));
    }
    index += 2 + length;
  }
  return concat(parts);
}

function pngChunkType(bytes: Uint8Array, at: number): string {
  return String.fromCharCode(
    bytes[at] ?? 0,
    bytes[at + 1] ?? 0,
    bytes[at + 2] ?? 0,
    bytes[at + 3] ?? 0,
  );
}

const pngDrop = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);

export function stripPngMetadata(bytes: Uint8Array): Uint8Array | null {
  if (!startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return null;
  }
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let index = 8;
  while (index + 12 <= bytes.byteLength) {
    const length =
      ((bytes[index] ?? 0) << 24) |
      ((bytes[index + 1] ?? 0) << 16) |
      ((bytes[index + 2] ?? 0) << 8) |
      (bytes[index + 3] ?? 0);
    const total = 12 + length;
    if (length < 0 || index + total > bytes.byteLength) {
      return null;
    }
    const type = pngChunkType(bytes, index + 4);
    if (!pngDrop.has(type)) {
      parts.push(bytes.subarray(index, index + total));
    }
    index += total;
    if (type === "IEND") {
      break;
    }
  }
  return concat(parts);
}

/** WebP stores EXIF/XMP as RIFF chunks; drop those, keep VP8/VP8L/VP8X/ALPH. */
export function stripWebpMetadata(bytes: Uint8Array): Uint8Array | null {
  if (sniffImageMime(bytes) !== "image/webp" || bytes.byteLength < 12) {
    return null;
  }
  const keep: Uint8Array[] = [];
  let index = 12;
  while (index + 8 <= bytes.byteLength) {
    const fourcc = String.fromCharCode(
      bytes[index] ?? 0,
      bytes[index + 1] ?? 0,
      bytes[index + 2] ?? 0,
      bytes[index + 3] ?? 0,
    );
    const size =
      (bytes[index + 4] ?? 0) |
      ((bytes[index + 5] ?? 0) << 8) |
      ((bytes[index + 6] ?? 0) << 16) |
      ((bytes[index + 7] ?? 0) << 24);
    const padded = size + (size % 2);
    if (index + 8 + padded > bytes.byteLength) {
      return null;
    }
    if (fourcc !== "EXIF" && fourcc !== "XMP " && fourcc !== "ICCP") {
      keep.push(bytes.subarray(index, index + 8 + padded));
    }
    index += 8 + padded;
  }
  const payload = concat(keep);
  const header = new Uint8Array(12);
  header.set(bytes.subarray(0, 8), 0);
  const riffSize = payload.byteLength + 4;
  header[4] = riffSize & 0xff;
  header[5] = (riffSize >> 8) & 0xff;
  header[6] = (riffSize >> 16) & 0xff;
  header[7] = (riffSize >> 24) & 0xff;
  return concat([header, payload]);
}

export function sanitizeImageUpload(bytes: Uint8Array): { mime: ImageMime; bytes: Uint8Array } | null {
  const mime = sniffImageMime(bytes);
  if (!mime) {
    return null;
  }
  if (mime === "image/jpeg") {
    const cleaned = stripJpegMetadata(bytes);
    return cleaned && cleaned.byteLength > 4 ? { mime, bytes: cleaned } : null;
  }
  if (mime === "image/png") {
    const cleaned = stripPngMetadata(bytes);
    return cleaned && cleaned.byteLength > 16 ? { mime, bytes: cleaned } : null;
  }
  const cleaned = stripWebpMetadata(bytes);
  return cleaned && cleaned.byteLength > 12 ? { mime, bytes: cleaned } : null;
}

function fileExtension(fileName: string): string {
  const base = fileName.trim().split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    return "";
  }
  return base.slice(dot + 1).toLowerCase();
}

function looksLikePdf(bytes: Uint8Array): boolean {
  return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
}

function looksLikeZip(bytes: Uint8Array): boolean {
  return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]);
}

function looksLikeOle(bytes: Uint8Array): boolean {
  return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function looksLikeHtml(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 256)).trimStart().toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html") || head.startsWith("<svg");
}

/** Data-room uploads: extension allowlist plus magic bytes. SVG/HTML never stored. */
export function dataRoomUploadAllowed(fileName: string, bytes: Uint8Array): boolean {
  if (bytes.byteLength === 0) {
    return false;
  }
  const extension = fileExtension(fileName);
  if (!dataRoomExtensions.has(extension)) {
    return false;
  }
  if (extension === "pdf") {
    return looksLikePdf(bytes);
  }
  if (extension === "png" || extension === "jpg" || extension === "jpeg" || extension === "webp") {
    return sanitizeImageUpload(bytes) !== null;
  }
  if (extension === "docx" || extension === "xlsx") {
    return looksLikeZip(bytes);
  }
  if (extension === "doc" || extension === "xls") {
    return looksLikeOle(bytes) || looksLikeZip(bytes);
  }
  if (extension === "txt" || extension === "csv") {
    return !looksLikeHtml(bytes) && !bytes.includes(0);
  }
  return false;
}
