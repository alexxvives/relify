import { getCurrentUser } from "@/server/getCurrentUser";
import { readAdminAdjustmentDocument } from "@/server/readAdjustmentDocument";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; fileId: string }> },
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }
  const { slug, fileId } = await context.params;
  const file = await readAdminAdjustmentDocument(user, slug, fileId);
  if (!file) {
    return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": contentType(file.fileName),
      "Content-Disposition": contentDisposition(file.fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
