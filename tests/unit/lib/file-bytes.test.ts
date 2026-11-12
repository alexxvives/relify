import { describe, expect, it } from "vitest";
import {
  dataRoomUploadAllowed,
  sanitizeImageUpload,
  sniffImageMime,
  stripJpegMetadata,
} from "@/lib/file-bytes";

function jpegWithApp1(): Uint8Array {
  const soi = [0xff, 0xd8];
  const app1 = [0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66];
  const dqt = [0xff, 0xdb, 0x00, 0x04, 0x00, 0x01];
  const sos = [0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xaa];
  const eoi = [0xff, 0xd9];
  return Uint8Array.from([...soi, ...app1, ...dqt, ...sos, ...eoi]);
}

function pngWithText(): Uint8Array {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ihdr = [
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00,
    0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
  ];
  const text = [0x00, 0x00, 0x00, 0x05, 0x74, 0x45, 0x58, 0x74, 0x41, 0x3d, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00];
  const iend = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
  return Uint8Array.from([...signature, ...ihdr, ...text, ...iend]);
}

describe("image sniff and EXIF strip", () => {
  it("sniffs JPEG and drops the APP1 Exif segment", () => {
    const raw = jpegWithApp1();
    expect(sniffImageMime(raw)).toBe("image/jpeg");
    const stripped = stripJpegMetadata(raw);
    expect(stripped).not.toBeNull();
    if (stripped === null) {
      return;
    }
    expect(Array.from(stripped).includes(0xe1)).toBe(false);
    expect(new TextDecoder().decode(stripped)).not.toContain("Exif");
    const prepared = sanitizeImageUpload(raw);
    expect(prepared?.mime).toBe("image/jpeg");
    expect(prepared && prepared.bytes.byteLength < raw.byteLength).toBe(true);
  });

  it("sniffs PNG and drops tEXt", () => {
    const raw = pngWithText();
    const prepared = sanitizeImageUpload(raw);
    expect(prepared?.mime).toBe("image/png");
    expect(prepared && new TextDecoder().decode(prepared.bytes).includes("tEXt")).toBe(false);
  });

  it("rejects HTML pretending to be a JPEG", () => {
    const html = new TextEncoder().encode("<!doctype html><script>alert(1)</script>");
    expect(sniffImageMime(html)).toBeNull();
    expect(sanitizeImageUpload(html)).toBeNull();
  });
});

describe("dataRoomUploadAllowed", () => {
  it("accepts a PDF header and rejects HTML / SVG / path tricks", () => {
    const pdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n");
    expect(dataRoomUploadAllowed("cuentas.pdf", pdf)).toBe(true);
    expect(dataRoomUploadAllowed("../cuentas.pdf", pdf)).toBe(true);
    expect(dataRoomUploadAllowed("page.html", new TextEncoder().encode("<html>"))).toBe(false);
    expect(dataRoomUploadAllowed("logo.svg", new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBe(
      false,
    );
    expect(dataRoomUploadAllowed("notes.txt", new TextEncoder().encode("<!doctype html>"))).toBe(false);
    expect(dataRoomUploadAllowed("photo.jpg", new TextEncoder().encode("<html>"))).toBe(false);
    expect(dataRoomUploadAllowed("cuentas.pdf", new TextEncoder().encode("<html>"))).toBe(false);
  });
});
