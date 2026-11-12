import { getCurrentUser } from "@/lib/server/get-current-user";
import { adminTeaserPdf } from "@/lib/server/company-pdfs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(null, { status: 404 });
  }
  const { slug } = await context.params;
  const params = new URL(request.url).searchParams;
  const download = params.has("download");
  const preview = params.has("preview");
  const response = await adminTeaserPdf(user, slug, download, { log: download && !preview });
  return response ?? new Response(null, { status: 404 });
}
