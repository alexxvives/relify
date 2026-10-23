export function signatureJpeg(value: unknown): Buffer | null {
  if (typeof value !== "string" || !value.startsWith("data:image/jpeg;base64,")) {
    return null;
  }

  const bytes = Buffer.from(value.slice("data:image/jpeg;base64,".length), "base64");

  if (bytes.byteLength < 80 || bytes.byteLength > 400_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  return bytes;
}

export function signatureBytes(value: Buffer): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(value);
}

export function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }

    const marker = bytes[offset + 1] ?? 0;

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const length = bytes.readUInt16BE(offset + 2);

    if (length < 2) {
      return null;
    }

    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = bytes.readUInt16BE(offset + 5);
      const width = bytes.readUInt16BE(offset + 7);
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += 2 + length;
  }

  return null;
}
