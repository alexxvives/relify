/** Private, inline file download with a safe name and a content type from the extension. */
const types: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  txt: "text/plain; charset=utf-8",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function contentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return types[extension] ?? "application/octet-stream";
}

function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export function privateFileResponse(fileName: string, bytes: Uint8Array): Response {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType(fileName),
      "Content-Disposition": contentDisposition(fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
