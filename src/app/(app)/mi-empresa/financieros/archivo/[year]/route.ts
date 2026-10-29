import { getCurrentUser } from "@/server/getCurrentUser";
import { listFilings, readFilingFile } from "@/server/financialFilings";

export async function GET(request: Request, context: { params: Promise<{ year: string }> }): Promise<Response> {
  const user = await getCurrentUser();

  if (!user) {
    return new Response(null, { status: 401 });
  }

  const year = Number((await context.params).year);
  const requested = new URL(request.url).searchParams.get("proyecto");
  const projectId = user.role === "admin" && requested ? requested : (await listFilings(user))?.projectId;

  if (!projectId || !Number.isInteger(year)) {
    return new Response(null, { status: 404 });
  }

  const file = await readFilingFile(user, projectId, year);

  if (!file) {
    return new Response(null, { status: 404 });
  }

  const ascii = file.fileName.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType === "application/pdf" ? "application/pdf" : "application/octet-stream",
      "Content-Disposition": `attachment; filename="${ascii}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
